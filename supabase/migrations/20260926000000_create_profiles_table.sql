-- 회원 프로필 테이블: auth.users와 1:1 관계
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_length check (username is null or char_length(username) between 3 and 30)
);

comment on table public.profiles is '회원가입한 사용자의 프로필 정보';

-- RLS 활성화
alter table public.profiles enable row level security;

-- 로그인한 사용자는 모든 프로필 조회 가능
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- 본인 프로필만 생성 가능
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- 본인 프로필만 수정 가능
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- updated_at 자동 갱신
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 회원가입 시 프로필 자동 생성
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이메일 변경 시 프로필 이메일 동기화
create function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_update();

-- 트리거 함수는 RPC로 직접 호출하지 못하게 막기
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_update() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- 기존 가입자 백필
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;
