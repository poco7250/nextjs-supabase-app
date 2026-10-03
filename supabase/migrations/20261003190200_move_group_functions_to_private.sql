-- Task 008 (3): security definer 함수를 API 비노출 스키마(private)로 옮긴다.
-- Supabase 린트 0028/0029는 노출 스키마(public)의 security definer 함수를 anon/authenticated가 실행할 수 있으면 경고한다.
-- 구현(security definer)과 RLS 헬퍼는 private에 두고, 클라이언트 RPC는 public의 security invoker 래퍼로만 노출한다.
-- 정책은 함수를 OID로 참조하므로 헬퍼를 옮겨도 그대로 동작한다.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

alter function public.require_auth_uid() set schema private;
alter function public.sync_group_owner_id(uuid) set schema private;
alter function public.is_group_member(uuid) set schema private;
alter function public.is_group_admin(uuid) set schema private;
alter function public.create_group(text, text) set schema private;
alter function public.get_invite_preview(text) set schema private;
alter function public.accept_invite(text) set schema private;
alter function public.regenerate_invite(uuid) set schema private;
alter function public.change_member_role(uuid, uuid, text) set schema private;
alter function public.remove_member(uuid, uuid) set schema private;

-- ─────────────────────────────────────────────
-- 다른 함수를 public.*로 부르던 본문을 private.* 참조로 다시 만든다
-- ─────────────────────────────────────────────

create or replace function private.create_group(p_name text, p_description text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_auth_uid();
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

create or replace function private.accept_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_auth_uid();
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

create or replace function private.regenerate_invite(p_group_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_auth_uid();
  v_token text;
begin
  if not private.is_group_admin(p_group_id) then
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

create or replace function private.change_member_role(p_group_id uuid, p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_auth_uid();
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

  perform private.sync_group_owner_id(p_group_id);
end;
$$;

create or replace function private.remove_member(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_auth_uid();
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

  perform private.sync_group_owner_id(p_group_id);
end;
$$;

-- ─────────────────────────────────────────────
-- public RPC 래퍼 (security invoker). 클라이언트는 supabase.rpc('<이름>')으로 호출한다
-- ─────────────────────────────────────────────

create function public.create_group(p_name text, p_description text)
returns uuid
language sql
security invoker
set search_path = ''
as $$ select private.create_group(p_name, p_description); $$;

create function public.get_invite_preview(p_token text)
returns table (group_name text, group_description text, status text, is_member boolean)
language sql
stable
security invoker
set search_path = ''
as $$ select * from private.get_invite_preview(p_token); $$;

create function public.accept_invite(p_token text)
returns uuid
language sql
security invoker
set search_path = ''
as $$ select private.accept_invite(p_token); $$;

create function public.regenerate_invite(p_group_id uuid)
returns text
language sql
security invoker
set search_path = ''
as $$ select private.regenerate_invite(p_group_id); $$;

create function public.change_member_role(p_group_id uuid, p_user_id uuid, p_role text)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.change_member_role(p_group_id, p_user_id, p_role); $$;

create function public.remove_member(p_group_id uuid, p_user_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.remove_member(p_group_id, p_user_id); $$;

-- ─────────────────────────────────────────────
-- 실행 권한: 전부 회수 → 필요한 것만 부여
-- ─────────────────────────────────────────────

revoke execute on all functions in schema private from public, anon, authenticated;

revoke execute on function public.create_group(text, text) from public, anon, authenticated;
revoke execute on function public.get_invite_preview(text) from public, anon, authenticated;
revoke execute on function public.accept_invite(text) from public, anon, authenticated;
revoke execute on function public.regenerate_invite(uuid) from public, anon, authenticated;
revoke execute on function public.change_member_role(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.remove_member(uuid, uuid) from public, anon, authenticated;

-- RLS 정책에서 쓰는 헬퍼
grant execute on function private.is_group_member(uuid) to authenticated;
grant execute on function private.is_group_admin(uuid) to authenticated;

-- 래퍼가 invoker 권한으로 부르는 구현
grant execute on function private.create_group(text, text) to authenticated;
grant execute on function private.get_invite_preview(text) to anon, authenticated;
grant execute on function private.accept_invite(text) to authenticated;
grant execute on function private.regenerate_invite(uuid) to authenticated;
grant execute on function private.change_member_role(uuid, uuid, text) to authenticated;
grant execute on function private.remove_member(uuid, uuid) to authenticated;

-- 클라이언트 RPC
grant execute on function public.create_group(text, text) to authenticated;
grant execute on function public.get_invite_preview(text) to anon, authenticated;
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.regenerate_invite(uuid) to authenticated;
grant execute on function public.change_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
