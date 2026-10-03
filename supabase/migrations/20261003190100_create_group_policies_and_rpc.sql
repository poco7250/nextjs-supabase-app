-- Task 008 (2): 그룹 RLS 헬퍼·정책·RPC (docs/db-schema.md §6.1, §6.2, §7)
-- 모든 함수는 security definer + set search_path = ''이고, 실행 권한을 전부 회수한 뒤 필요한 것만 다시 준다.
-- RPC 실패는 'CODE: 메시지' (errcode P0001)로 알리고, repository가 CODE를 ActionErrorCode로 바꾼다.

-- ─────────────────────────────────────────────
-- 내부 함수 (클라이언트 실행 불가)
-- ─────────────────────────────────────────────

-- 로그인 사용자 id를 돌려준다. 비로그인이면 UNAUTHENTICATED
create function public.require_auth_uid()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'UNAUTHENTICATED: 로그인이 필요해요.' using errcode = 'P0001';
  end if;
  return v_uid;
end;
$$;

-- groups.owner_id가 현재 owner를 가리키도록 맞춘다.
-- owner_id 사용자가 여전히 owner면 그대로 두고, 아니면 남은 owner 중 가장 먼저 가입한 사람으로 옮긴다.
create function public.sync_group_owner_id(p_group_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.groups g
  set owner_id = (
    select m.user_id
    from public.group_members m
    where m.group_id = p_group_id and m.role = 'owner'
    order by (m.user_id = g.owner_id) desc, m.joined_at
    limit 1
  )
  where g.id = p_group_id
    and not exists (
      select 1 from public.group_members m
      where m.group_id = p_group_id and m.user_id = g.owner_id and m.role = 'owner'
    );
$$;

-- ─────────────────────────────────────────────
-- RLS 헬퍼 (§6.1) — boolean만 반환
-- ─────────────────────────────────────────────

create function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = (select auth.uid())
  );
$$;

create function public.is_group_admin(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id
      and user_id = (select auth.uid())
      and role in ('owner', 'admin')
  );
$$;

-- ─────────────────────────────────────────────
-- RLS 정책 (§7)
-- ─────────────────────────────────────────────

create policy "groups_select_member"
  on public.groups for select
  to authenticated
  using (public.is_group_member(id));

-- 그룹 정보 수정은 admin 이상. 수정 가능한 컬럼은 아래 컬럼 권한으로 name·description만 허용
create policy "groups_update_admin"
  on public.groups for update
  to authenticated
  using (public.is_group_admin(id))
  with check (public.is_group_admin(id));

create policy "group_members_select_member"
  on public.group_members for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "group_invites_select_admin"
  on public.group_invites for select
  to authenticated
  using (public.is_group_admin(group_id));

-- owner_id 변경은 change_member_role(위임)만 처리한다
revoke update on public.groups from anon, authenticated;
grant update (name, description) on public.groups to authenticated;

-- ─────────────────────────────────────────────
-- 클라이언트 RPC (§6.2)
-- ─────────────────────────────────────────────

-- 그룹 생성 (F001): 그룹 + owner 멤버 + 첫 초대(무기한)를 한 트랜잭션으로
create function public.create_group(p_name text, p_description text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_auth_uid();
  v_group_id uuid;
begin
  insert into public.groups (name, description, owner_id)
  values (trim(p_name), nullif(trim(p_description), ''), v_uid)
  returning id into v_group_id;

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, v_uid, 'owner');

  insert into public.group_invites (group_id, created_by)
  values (v_group_id, v_uid);

  return v_group_id;
end;
$$;

-- 초대 미리보기 (F003, anon 허용): 무효·만료면 그룹 정보 없이 상태만, 그 외 컬럼은 반환하지 않는다
create function public.get_invite_preview(p_token text)
returns table (group_name text, group_description text, status text, is_member boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_invite record;
begin
  select i.group_id, i.expires_at, i.revoked_at, g.name, g.description
  into v_invite
  from public.group_invites i
  join public.groups g on g.id = i.group_id
  where i.token = p_token;

  if not found or v_invite.revoked_at is not null then
    return query select null::text, null::text, 'invalid'::text, false;
    return;
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    return query select null::text, null::text, 'expired'::text, false;
    return;
  end if;

  return query select
    v_invite.name,
    v_invite.description,
    'valid'::text,
    v_uid is not null and exists (
      select 1 from public.group_members m
      where m.group_id = v_invite.group_id and m.user_id = v_uid
    );
end;
$$;

-- 초대 수락 (F003): 이미 멤버면 아무것도 하지 않고 group id 반환
create function public.accept_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_auth_uid();
  v_group_id uuid;
begin
  -- 동시에 재발급되면 재발급이 이 트랜잭션 뒤로 밀리도록 초대 행을 공유 잠금
  select group_id into v_group_id
  from public.group_invites
  where token = p_token
    and revoked_at is null
    and (expires_at is null or expires_at > now())
  for share;

  if v_group_id is null then
    raise exception 'INVALID_INVITE: 유효하지 않거나 만료된 초대 링크예요.' using errcode = 'P0001';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, v_uid, 'member')
  on conflict (group_id, user_id) do nothing;

  return v_group_id;
end;
$$;

-- 초대 링크 재발급 (F002, admin 이상): 기존 활성 초대를 무효화하고 새로 발급
create function public.regenerate_invite(p_group_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_auth_uid();
  v_token text;
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'FORBIDDEN: 그룹 관리자만 할 수 있어요.' using errcode = 'P0001';
  end if;

  -- 같은 그룹의 재발급·멤버 변경을 직렬화 (FK 삽입의 key share는 막지 않음)
  perform 1 from public.groups where id = p_group_id for no key update;

  update public.group_invites
  set revoked_at = now()
  where group_id = p_group_id and revoked_at is null;

  insert into public.group_invites (group_id, created_by)
  values (p_group_id, v_uid)
  returning token into v_token;

  return v_token;
end;
$$;

-- 멤버 역할 변경 (F004). 규칙은 lib/groups/member-permissions.ts와 같다
create function public.change_member_role(p_group_id uuid, p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_auth_uid();
  v_viewer_role text;
  v_target_role text;
  v_owner_count integer;
begin
  if p_role is null or p_role not in ('owner', 'admin', 'member') then
    raise exception 'VALIDATION: 역할을 선택해 주세요.' using errcode = 'P0001';
  end if;

  perform 1 from public.groups where id = p_group_id for no key update;
  if not found then
    raise exception 'NOT_FOUND: 그룹을 찾을 수 없어요.' using errcode = 'P0001';
  end if;

  select role into v_viewer_role from public.group_members
  where group_id = p_group_id and user_id = v_uid;
  if v_viewer_role is null or v_viewer_role not in ('owner', 'admin') then
    raise exception 'FORBIDDEN: 그룹 관리자만 할 수 있어요.' using errcode = 'P0001';
  end if;

  select role into v_target_role from public.group_members
  where group_id = p_group_id and user_id = p_user_id;
  if v_target_role is null then
    raise exception 'NOT_FOUND: 그룹 멤버를 찾을 수 없어요.' using errcode = 'P0001';
  end if;

  -- 같은 역할이면 아무것도 하지 않는다(멱등)
  if v_target_role = p_role then
    return;
  end if;

  select count(*) into v_owner_count from public.group_members
  where group_id = p_group_id and role = 'owner';
  if v_target_role = 'owner' and v_owner_count <= 1 then
    raise exception 'CONFLICT: 그룹에는 소유자가 최소 1명 있어야 해요.' using errcode = 'P0001';
  end if;

  -- admin은 owner를 바꾸거나 누구도 owner로 올릴 수 없다
  if v_viewer_role = 'admin' and (v_target_role = 'owner' or p_role = 'owner') then
    raise exception 'FORBIDDEN: 이 멤버의 역할을 바꿀 수 없어요.' using errcode = 'P0001';
  end if;

  update public.group_members set role = p_role
  where group_id = p_group_id and user_id = p_user_id;

  perform public.sync_group_owner_id(p_group_id);
end;
$$;

-- 멤버 내보내기 (F005): group_members 행만 삭제. 미래 이벤트 RSVP 정리(D1)는 Task 011에서 추가
create function public.remove_member(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_auth_uid();
  v_viewer_role text;
  v_target_role text;
  v_owner_count integer;
begin
  perform 1 from public.groups where id = p_group_id for no key update;
  if not found then
    raise exception 'NOT_FOUND: 그룹을 찾을 수 없어요.' using errcode = 'P0001';
  end if;

  select role into v_viewer_role from public.group_members
  where group_id = p_group_id and user_id = v_uid;
  if v_viewer_role is null or v_viewer_role not in ('owner', 'admin') then
    raise exception 'FORBIDDEN: 그룹 관리자만 할 수 있어요.' using errcode = 'P0001';
  end if;

  select role into v_target_role from public.group_members
  where group_id = p_group_id and user_id = p_user_id;
  if v_target_role is null then
    raise exception 'NOT_FOUND: 그룹 멤버를 찾을 수 없어요.' using errcode = 'P0001';
  end if;

  select count(*) into v_owner_count from public.group_members
  where group_id = p_group_id and role = 'owner';
  if v_target_role = 'owner' and v_owner_count <= 1 then
    raise exception 'CONFLICT: 마지막 소유자는 내보낼 수 없어요.' using errcode = 'P0001';
  end if;

  -- 자기 자신, (admin이 볼 때) owner는 내보낼 수 없다
  if p_user_id = v_uid or (v_viewer_role = 'admin' and v_target_role = 'owner') then
    raise exception 'FORBIDDEN: 이 멤버를 내보낼 수 없어요.' using errcode = 'P0001';
  end if;

  delete from public.group_members
  where group_id = p_group_id and user_id = p_user_id;

  perform public.sync_group_owner_id(p_group_id);
end;
$$;

-- ─────────────────────────────────────────────
-- 실행 권한: 전부 회수 → 필요한 것만 부여
-- ─────────────────────────────────────────────

revoke execute on function public.require_auth_uid() from public, anon, authenticated;
revoke execute on function public.sync_group_owner_id(uuid) from public, anon, authenticated;
revoke execute on function public.is_group_member(uuid) from public, anon, authenticated;
revoke execute on function public.is_group_admin(uuid) from public, anon, authenticated;
revoke execute on function public.create_group(text, text) from public, anon, authenticated;
revoke execute on function public.get_invite_preview(text) from public, anon, authenticated;
revoke execute on function public.accept_invite(text) from public, anon, authenticated;
revoke execute on function public.regenerate_invite(uuid) from public, anon, authenticated;
revoke execute on function public.change_member_role(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.remove_member(uuid, uuid) from public, anon, authenticated;

-- RLS 정책에서 쓰는 헬퍼
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_admin(uuid) to authenticated;

-- 클라이언트 RPC
grant execute on function public.create_group(text, text) to authenticated;
grant execute on function public.get_invite_preview(text) to anon, authenticated;
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.regenerate_invite(uuid) to authenticated;
grant execute on function public.change_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
