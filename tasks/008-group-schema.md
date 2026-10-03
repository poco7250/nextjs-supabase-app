# 008. 그룹·멤버·초대 스키마, RLS, 헬퍼 함수 구축

- ROADMAP: Task 008
- 규모: M | 기능 ID: F001~F005 | 의존: Task 004

## 명세

`docs/db-schema.md`의 Task 008 범위(§3.3~3.5, §4, §5, §6.1~6.2, §7)를 마이그레이션으로 구현한다. 테이블은 `groups`, `group_members`, `group_invites`이고 RLS 헬퍼 2개, 클라이언트 RPC 6개를 만든다. 화면 연동은 Task 009~011에서 한다.

결정 사항:

- **D8 초대 만료 기간**: 문서 권장안대로 무기한(`expires_at = null`)으로 확정한다. 초대는 재발급으로만 무효화한다. 컬럼은 남겨 두어 나중에 기한을 도입할 수 있게 한다.
- 마이그레이션은 두 개로 나눈다. (1) 테이블·제약·인덱스·트리거·RLS 활성화, (2) 헬퍼·RLS 정책·컬럼 권한·RPC.
- 그룹 행을 바꾸는 RPC(`regenerate_invite`, `change_member_role`, `remove_member`)는 `groups` 행을 `for no key update`로 잠근다. 같은 그룹의 멤버 변경이 직렬화되고, `accept_invite`의 FK 삽입(`key share`)은 막지 않는다.
- `accept_invite`는 초대 행을 `for share`로 잠근다. 동시에 재발급이 들어오면 재발급이 수락 트랜잭션 뒤로 밀린다.
- `groups.owner_id`는 항상 현재 owner 중 한 명을 가리킨다. 역할 변경·내보내기로 `owner_id` 사용자가 owner가 아니게 되면, 남은 owner 중 가장 먼저 가입한 사람으로 옮긴다(내부 함수 `sync_group_owner_id`).
- 같은 역할로 바꾸는 요청은 에러 없이 아무것도 하지 않는다(멱등).
- 에러 순서는 목 액션(`lib/mocks/actions.ts`)과 같다. 대상 없음은 NOT_FOUND, 마지막 owner는 CONFLICT, 권한 위반은 FORBIDDEN이다.
- **security definer 함수는 `private` 스키마**에 둔다. 처음에는 설계 문서대로 `public`에 만들었는데, `get_advisors`가 린트 0028/0029 경고 9건을 냈다(노출 스키마의 security definer 함수를 anon/authenticated가 실행 가능). Supabase 권장 방식대로 구현과 RLS 헬퍼를 API 비노출 `private` 스키마로 옮기고, `public`에는 같은 이름의 `security invoker` 래퍼만 남겼다(세 번째 마이그레이션). 클라이언트 호출(`supabase.rpc('create_group')`)은 그대로다. 이후 DB Task도 이 규칙을 따른다(`docs/db-schema.md` §1).
- 내보내기 시 미래 이벤트 RSVP 처리(D1)는 events 테이블이 생긴 뒤 Task 011에서 넣는다. 지금은 `group_members` 행만 지운다.

## 관련 파일

| 파일                                                                     | 구분 | 설명                                                          |
| ------------------------------------------------------------------------ | ---- | ------------------------------------------------------------- |
| `supabase/migrations/20261003190000_create_group_tables.sql`             | 생성 | 테이블 3개, CHECK·UNIQUE·부분 유니크, 인덱스, 트리거          |
| `supabase/migrations/20261003190100_create_group_policies_and_rpc.sql`   | 생성 | 헬퍼 2개, RLS 정책, 컬럼 권한, RPC 6개, 내부 함수             |
| `supabase/migrations/20261003190200_move_group_functions_to_private.sql` | 생성 | security definer 함수를 `private`로 이동, public invoker 래퍼 |
| `lib/supabase/database.types.ts`                                         | 수정 | `generate_typescript_types`로 재생성                          |
| `docs/db-schema.md`                                                      | 수정 | D8 확정, 구현 중 정한 세부 사항 반영                          |

## 수락 기준

- [x] 비멤버 JWT로 `groups`/`group_members` 조회 시 0행
- [x] anon이 `get_invite_preview`로 그룹명·설명·상태·멤버 여부 외의 컬럼을 얻을 수 없다
- [x] 권한 규칙: 마지막 owner 강등·내보내기 불가, admin은 owner를 변경·내보낼 수 없음, owner 위임 시 `groups.owner_id` 동기화
- [x] `get_advisors`(security)에서 이 Task로 생긴 경고 0건
- [x] `database.types.ts` 재생성, `npm run check` 통과

## 구현 단계

- [x] (1) 테이블 마이그레이션
- [x] (2) 헬퍼·RLS·RPC 마이그레이션 + advisors 확인
- [x] (3) SQL 시나리오 검증, 타입 재생성, 문서·로드맵 반영

## 테스트 체크리스트

> SQL로 검증한다. 테스트 데이터는 트랜잭션 안에서 만들고 롤백해서 DB에 남기지 않는다. 사용자 JWT는 `set local role authenticated` + `request.jwt.claims`로 흉내 낸다.

- [x] `create_group`: 그룹 + owner 멤버 + 활성 초대 1개 생성, 빈 이름·51자 이름 CHECK 위반
- [x] 비멤버: `groups`·`group_members`·`group_invites` 0행, `groups` 직접 update 0행
- [x] member: 자기 그룹 조회 가능, `group_invites` 0행, `regenerate_invite`·`change_member_role`·`remove_member` FORBIDDEN
- [x] admin: 그룹명 수정 가능, `owner_id` 직접 수정은 권한 거부, owner 변경·내보내기 FORBIDDEN, member 승격 가능
- [x] owner: 마지막 owner 강등·내보내기 CONFLICT, owner 위임 후 강등 시 `owner_id` 이전
- [x] `get_invite_preview`(anon): valid/invalid(재발급 후 이전 토큰)/없는 토큰, 반환 컬럼 4개만
- [x] `accept_invite`: 가입, 중복 수락 시 행 1개 유지, 무효 토큰 INVALID_INVITE, 비로그인 UNAUTHENTICATED
- [x] 직접 insert(`group_members`, `group_invites`, `groups`) 거부

## 변경 사항 요약

- 테이블: `groups`(이름 trim 1~50자·설명 500자 CHECK, `owner_id` restrict, `updated_at` 트리거), `group_members`(role CHECK, `unique(group_id, user_id)`), `group_invites`(base64url 32자 토큰 기본값, `unique(token)`, 부분 유니크 `group_invites_active_key`). 인덱스 `groups(owner_id)`, `group_members(user_id)`, `group_invites(created_by)`.
- RLS: groups 조회는 멤버, 수정은 admin(컬럼 권한으로 `name`·`description`만), group_members 조회는 같은 그룹 멤버, group_invites 조회는 admin. 쓰기 정책은 없어서 직접 insert/update/delete는 거부되고 RPC로만 쓴다.
- 함수: `private.is_group_member`/`is_group_admin`(RLS 헬퍼), `private.require_auth_uid`/`sync_group_owner_id`(내부), RPC 6종(`private` 구현 + `public` invoker 래퍼).
- 타입: `database.types.ts`에 테이블 3개와 RPC 6개를 반영했다. `get_invite_preview`의 그룹명·설명은 무효·만료일 때 null이니 Task 010 repository에서 null로 다룬다.
- 검증(2026-10-03)
  - SQL 시나리오 46개를 통과했다. 시나리오는 DO 블록 하나에서 역할별 `request.jwt.claims`를 바꿔 가며 실행하고, 마지막에 예외로 롤백했다. 실행 후 세 테이블 모두 0행으로, 남은 데이터가 없음을 확인했다.
  - 권한: anon은 `accept_invite`·private 헬퍼 실행 불가, authenticated는 내부 함수 실행 불가. `get_invite_preview` 반환은 `TABLE(group_name, group_description, status, is_member)` 4개 컬럼이다.
  - `get_advisors`(security): 이 Task로 생긴 경고 0건. 기존 Auth 설정 경고 1건(유출 비밀번호 보호 꺼짐)은 남아 있다. performance는 새 인덱스의 `unused_index`(INFO)만 나온다(데이터가 없어서다).
  - `npm run check` 통과(테스트 86개).
