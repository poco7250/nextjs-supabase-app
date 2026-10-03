-- Task 008 (1): 그룹·멤버·초대 테이블 (docs/db-schema.md §3.3~3.5, §4, §5)
-- 정책·헬퍼·RPC는 다음 마이그레이션(create_group_policies_and_rpc)에서 만든다.

-- 그룹
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 길이 상한은 lib/validations/group.ts의 GROUP_NAME_MAX·GROUP_DESCRIPTION_MAX와 같다
  constraint groups_name_length check (char_length(trim(name)) >= 1 and char_length(name) <= 50),
  constraint groups_description_length check (description is null or char_length(description) <= 500)
);

comment on table public.groups is '모임 그룹. owner_id는 현재 owner 중 한 명을 가리킨다';

create index groups_owner_id_idx on public.groups (owner_id);

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

-- 그룹 멤버 (내보내기는 이 행만 삭제, 이력 테이블은 profiles를 직접 참조)
create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  constraint group_members_role_check check (role in ('owner', 'admin', 'member')),
  constraint group_members_group_user_key unique (group_id, user_id)
);

comment on table public.group_members is '그룹 멤버십과 역할(owner/admin/member)';

-- 대시보드 "내 그룹" 조회, FK
create index group_members_user_id_idx on public.group_members (user_id);

-- 그룹 초대 링크 (D8: 기본은 무기한, 재발급으로만 무효화)
create table public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  -- 24바이트 → 패딩 없는 base64url 32자 (INVITE_TOKEN_PATTERN 충족)
  token text not null default translate(encode(extensions.gen_random_bytes(24), 'base64'), '+/', '-_'),
  created_by uuid not null references public.profiles (id) on delete restrict,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint group_invites_token_key unique (token)
);

comment on table public.group_invites is '그룹 초대 링크. revoked_at이 null인 행이 활성 초대(그룹당 1개)';

-- 그룹당 활성 초대는 1개 (부분 유니크라 인덱스로 만든다)
create unique index group_invites_active_key on public.group_invites (group_id) where revoked_at is null;

create index group_invites_created_by_idx on public.group_invites (created_by);

-- RLS 활성화 (정책은 다음 마이그레이션에서 추가, 그 전까지는 전부 거부)
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;
