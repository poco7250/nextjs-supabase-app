# 모임 이벤트 관리 웹 MVP 개발 로드맵

초대 링크 하나로 모임을 시작하고, 공지·참여자·카풀·정산을 한 화면에서 끝내는 모임 운영 도구.

> 기준 문서: `docs/PRD.md` (기술 검토 반영 완료본). 이 로드맵은 PRD를 수정하지 않고, 구현 순서와 작업 단위만 정의한다.

## 개요

모임 이벤트 관리 웹 MVP는 수영·헬스·친구 모임을 반복 운영하는 주최자와 카톡 초대 링크로 들어오는 참여자를 위한 도구다. 단톡방·엑셀·계좌번호 복붙으로 하던 일을 대신하며, 다음 기능을 제공한다.

- **그룹과 초대 링크 (F001~F005, F022)**: 그룹 생성, 토큰 기반 초대 링크(비로그인 미리보기), 역할(owner/admin/member)과 멤버 관리
- **이벤트와 RSVP (F006~F011)**: 이전 이벤트 복제, 수동 상태 관리, 그룹/이벤트 공지, 참석 응답, 정원 초과 대기열과 자동 승급, 출석 체크
- **카풀 (F012~F013)**: 운전자 등록, 선착순 탑승 신청/취소, 잔여 좌석 표시
- **정산 (F014~F015, F021)**: 항목별 N빵(나머지는 결제자 부담), 두 사람 간 차액 상계, 계좌/토스 링크 노출, 송금 완료/입금 확인, 확인 후 조정 항목으로만 정정
- **인증 (F020)**: 이메일, 구글(구현됨), 카카오(비즈 앱 심사 후 노출)

## 현재 상태 (출발점)

| 구분       | 내용                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 이미 된 것 | Next.js 16 App Router, `@supabase/ssr` 쿠키 인증(이메일 로그인/가입/비밀번호 재설정, 구글 OAuth), 루트 `proxy.ts` → `updateSession()`, `profiles` 테이블과 트리거, `database.types.ts`, Tailwind v3 + shadcn/ui, husky pre-commit, CI(typecheck/lint/format)                                                                                                                           |
| 정리 필요  | `app/instruments`(DB `instruments` 테이블 포함), `app/protected`, `components/tutorial`, `hero.tsx`, `deploy-button.tsx`, `next-logo.tsx`, `supabase-logo.tsx`, 스타터 메타데이터와 OG 이미지. 인증 후 리다이렉트 목적지가 `/protected`로 하드코딩되어 있음(`login-form.tsx`, `sign-up-form.tsx`, `update-password-form.tsx`, `google-login-button.tsx`, `app/auth/callback/route.ts`) |
| 아직 없음  | 테스트 러너, Zod, 도메인 테이블 전체, 로그인 후 레이아웃/내비게이션, 카카오 로그인                                                                                                                                                                                                                                                                                                     |

## 공통 규칙

### DB 작업 순서 (모든 DB Task에 적용, 순서 변경 금지)

1. **마이그레이션 파일 작성**: `supabase/migrations/<timestamp>_<설명>.sql`에 테이블, CHECK/UNIQUE 제약, 인덱스를 정의하고, 같은 내용을 Supabase MCP `apply_migration`으로 반영한다. 스키마 변경은 반드시 파일로 남긴다.
2. **RLS 정책과 헬퍼/RPC 함수**: 모든 테이블에 `enable row level security`를 켠다. 함수는 `security definer` + `set search_path = ''`로 만들고, 테이블은 스키마를 붙여 참조(`public.groups`)한다. 내부에서 `auth.uid()`로 권한을 확인한다. 트리거 전용 함수는 `anon`/`authenticated`의 실행 권한을 revoke하고, 클라이언트가 호출할 RPC만 `authenticated`(초대 미리보기는 `anon`도)에 grant한다. 반영 후 MCP `get_advisors`(security/performance)로 경고를 확인한다.
3. **타입 재생성**: MCP `generate_typescript_types` 결과로 `lib/supabase/database.types.ts`를 덮어쓴다. 직접 수정하지 않는다.

### 코드 구조

- 레이어드 구조: **Server Action / Route Handler(컨트롤러)** → `lib/services/*`(비즈니스 규칙) → `lib/repositories/*`(Supabase 쿼리·RPC 호출). 입력은 Zod 스키마로 검증한 DTO로만 전달한다.
- Server Action은 일관된 응답 형식 `ActionResult<T> = { ok: true; data: T } | { ok: false; error: { code; message } }`을 반환한다.
- 동시성이 걸린 쓰기(RSVP, 대기자 승급, 카풀 좌석, 정산 재계산)는 클라이언트가 테이블에 직접 쓰지 못하게 막고(RLS에서 insert/update 정책 미부여) RPC로만 처리한다.
- `console.log` 금지. `lib/logger.ts` 로거를 통해 기록한다.
- `cacheComponents: true` 환경이므로, 쿠키/세션을 읽는 컴포넌트는 `<Suspense>` 경계 안에 둔다. 코드 작성 전 `node_modules/next/dist/docs/`의 해당 가이드를 확인한다.

### 테스트

- 순수 로직(정산 계산, 권한 판정, Zod 스키마): Vitest 단위 테스트(`npm run test`).
- API 연동과 비즈니스 로직: Playwright MCP로 E2E 시나리오를 실행하고 결과를 작업 파일의 "## 테스트 체크리스트"에 기록한다.
- 동시성 RPC: 같은 이벤트/카풀에 요청을 병렬로 보내는 검증 스크립트(또는 MCP `execute_sql`로 여러 세션 시뮬레이션)로 정원·좌석 초과가 없는지 확인한다.

### 규모 표기

- **S**: 1~3일, **M**: 3~5일, **L**: 1~2주 (1인 기준 상대 규모)

## 개발 워크플로우

1. **작업 계획**
   - 기존 코드베이스를 학습하고 현재 상태를 파악
   - 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
   - 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**
   - 기존 코드베이스를 학습하고 현재 상태를 파악
   - `/tasks` 디렉토리에 새 작업 파일 생성 (디렉토리가 아직 없으므로 첫 작업 때 `tasks/000-sample.md`와 함께 만든다)
   - 명명 형식: `XXX-description.md` (예: `001-starter-cleanup.md`)
   - 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
   - **API/비즈니스 로직 작업 시 "## 테스트 체크리스트" 섹션 필수 포함 (Playwright MCP 테스트 시나리오 작성)**
   - 예시를 위해 `/tasks` 디렉토리의 마지막 완료된 작업 참조. 예를 들어 현재 작업이 `012`라면 `011`과 `010`을 참조
   - 완료된 작업 파일은 체크된 박스와 변경 사항 요약을 포함한다. 새 작업 파일은 빈 박스만 있고 변경 사항 요약이 없어야 한다. 초기 상태의 샘플은 `000-sample.md` 참조

3. **작업 구현**
   - 작업 파일의 명세서를 따름
   - 기능과 기능성 구현
   - **API 연동 및 비즈니스 로직 구현 시 Playwright MCP로 테스트 수행 필수**
   - 각 단계 후 작업 파일 내 단계 진행 상황 업데이트
   - 구현 완료 후 Playwright MCP를 사용한 E2E 테스트 실행
   - 테스트 통과 확인 후 다음 단계로 진행
   - 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**
   - 로드맵에서 완료된 작업을 ✅로 표시 (`/docs:update-roadmap` 커맨드 사용 가능)

## Phase 요약

| Phase | 이름                           | Task      | 개수 | 주요 기능 ID          |
| ----- | ------------------------------ | --------- | ---- | --------------------- |
| 0     | 기반 정리 및 애플리케이션 골격 | 001 ~ 006 | 6    | (기반), F020 선행     |
| 1     | 그룹·초대·멤버                 | 007 ~ 012 | 6    | F001~F005, F022       |
| 2     | 이벤트·공지·RSVP·대기자·출석   | 013 ~ 019 | 7    | F006~F011, F022       |
| 3     | 카풀                           | 020 ~ 023 | 4    | F012, F013            |
| 4     | 정산                           | 024 ~ 030 | 7    | F014, F015, F021      |
| 5     | 카카오 로그인·OG 메타·마무리   | 031 ~ 035 | 5    | F020, F003(공유 경험) |

각 기능 Phase(1~4)는 **UI(더미 데이터) Task → DB 스키마·RLS Task → 기능 연동 Task → 통합 테스트 Task** 순으로 구성한다. UI Task와 DB Task는 서로 의존하지 않으므로 병렬로 진행할 수 있다.

## 개발 단계

### Phase 0: 기반 정리 및 애플리케이션 골격

- **Task 001: 스타터 킷 잔여물 제거 및 인증 리다이렉트 정리** - 우선순위
  - 규모: S | 기능 ID: (기반), F020 | 의존: 없음
  - [ ] `app/instruments`, `app/protected`, `components/tutorial/`, `hero.tsx`, `deploy-button.tsx`, `next-logo.tsx`, `supabase-logo.tsx` 삭제 및 참조 제거
  - [ ] `instruments` 테이블 제거: 마이그레이션 파일(`drop table if exists public.instruments`) → `apply_migration` → `generate_typescript_types`로 타입 재생성
  - [ ] `lib/supabase/proxy.ts` 공개 경로에서 `/instruments` 조건 제거
  - [ ] 인증 후 기본 목적지를 `/protected`에서 `/dashboard`로 변경(`login-form.tsx`, `sign-up-form.tsx`, `update-password-form.tsx`, `google-login-button.tsx`, `app/auth/callback/route.ts`). 목적지 상수는 `lib/constants/routes.ts` 한 곳에서 관리
  - [ ] `app/layout.tsx` 메타데이터를 서비스명·한국어 설명으로 교체, `<html lang="ko">`
  - 완료 조건: 삭제한 파일을 가리키는 import가 없고, 로그인·구글 로그인 후 `/dashboard`(빈 페이지)로 이동하며, `database.types.ts`에 `instruments`가 없다

- **Task 002: 전체 라우트 구조 및 빈 페이지 생성**
  - 규모: S | 기능 ID: 전체 페이지 골격 | 의존: Task 001
  - [ ] 라우트 골격 생성 (각 페이지는 제목만 있는 빈 껍데기)
    ```
    app/page.tsx                                      랜딩
    app/invite/[token]/page.tsx                       초대 수락 (공개)
    app/(app)/layout.tsx                              로그인 후 공통 레이아웃
    app/(app)/dashboard/page.tsx                      내 그룹 목록
    app/(app)/profile/page.tsx                        내 프로필
    app/(app)/groups/new/page.tsx                     그룹 생성
    app/(app)/groups/[groupId]/layout.tsx             그룹 컨텍스트 (멤버 여부 확인)
    app/(app)/groups/[groupId]/page.tsx               그룹 홈
    app/(app)/groups/[groupId]/settings/page.tsx      그룹 설정 (owner/admin)
    app/(app)/groups/[groupId]/members/page.tsx       멤버 관리 (owner/admin)
    app/(app)/groups/[groupId]/events/new/page.tsx    이벤트 생성 (owner/admin)
    app/(app)/groups/[groupId]/events/[eventId]/layout.tsx
    app/(app)/groups/[groupId]/events/[eventId]/page.tsx             이벤트 상세
    app/(app)/groups/[groupId]/events/[eventId]/carpool/page.tsx     카풀
    app/(app)/groups/[groupId]/events/[eventId]/settlement/page.tsx  정산
    ```
  - [ ] `lib/constants/routes.ts`에 경로 빌더 함수 정의(`routes.group(groupId)` 등)
  - [ ] 각 세그먼트에 `loading.tsx`, `not-found.tsx`, `error.tsx` 기본 파일 배치
  - [ ] 동적 파라미터(`params`는 Promise) 처리 방식을 Next.js 16 문서로 확인하고 적용
  - 완료 조건: 모든 경로가 404 없이 렌더되고 `npm run build`가 통과한다

- **Task 003: 공통 레이아웃 및 하단 탭 내비게이션 구현**
  - 규모: M | 기능 ID: 메뉴 구조 전체 | 의존: Task 002
  - [ ] 필요한 shadcn/ui 컴포넌트 추가: `dialog`, `alert-dialog`, `sheet`, `select`, `textarea`, `tabs`, `avatar`, `separator`, `skeleton`, `sonner`(토스트), `form` 대체용 필드 래퍼
  - [ ] 모바일 우선 앱 셸: 상단 헤더(뒤로 가기, 페이지 제목, 컨텍스트 메뉴) + 하단 탭 바(`components/layout/bottom-tab-nav.tsx`)
  - [ ] 컨텍스트별 탭 구성
    - 공통: 대시보드 / 내 프로필
    - 그룹 내부: 그룹 홈 / 이벤트 만들기(owner/admin) / 멤버(owner/admin) / 설정(owner/admin)
    - 이벤트 내부: 상세 / 카풀 / 정산
  - [ ] 역할별 탭 노출은 props(`role`)로 받도록 설계해 Phase 1에서 실제 역할만 주입
  - [ ] 로그아웃은 내 프로필 페이지와 헤더 메뉴에 배치, 로그아웃 후 랜딩으로 이동
  - [ ] 다크 모드(`theme-switcher.tsx`) 유지, 터치 영역 44px 이상, 활성 탭 `aria-current`
  - 완료 조건: 360px 폭에서 가로 스크롤 없이 모든 탭이 보이고, 더미 역할을 바꾸면 관리자 탭 노출이 바뀐다

- **Task 004: 도메인 타입·Zod 스키마·레이어 구조 및 DB 스키마 설계**
  - 규모: M | 기능 ID: 전체 | 의존: Task 001
  - [ ] `zod` 설치, `lib/validations/*.ts`에 그룹·초대·이벤트·RSVP·공지·카풀·비용·계좌 입력 스키마 정의
  - [ ] `lib/types/domain.ts`: PRD 데이터 모델 기준 도메인 타입과 상태 enum(`GroupRole`, `EventStatus`, `RsvpStatus`, `CarpoolRiderStatus`) 정의. DB 타입 생성 후에는 `Database['public']['Tables']` 기반으로 연결
  - [ ] `lib/types/action-result.ts`(`ActionResult<T>`, 에러 코드 목록), `lib/logger.ts`(레벨별 로거, pino 등 검토) 작성
  - [ ] `lib/services/`, `lib/repositories/` 디렉토리와 작성 규칙(README 주석) 마련
  - [ ] `lib/mocks/`에 Phase 1~4 UI용 더미 데이터 생성기 작성(도메인 타입 준수)
  - [ ] `docs/db-schema.md`에 전체 ERD, CHECK/UNIQUE/부분 유니크 제약, 인덱스, 헬퍼 함수·RPC 목록과 시그니처 설계(구현은 각 Phase에서)
  - 완료 조건: 모든 더미 데이터가 도메인 타입으로 타입 체크되고, DB 설계 문서에 PRD의 12개 테이블과 제약이 빠짐없이 매핑된다

- **Task 005: 테스트 러너 도입 및 CI 연결**
  - 규모: S | 기능 ID: 품질 기반 (정산 로직 선행 조건) | 의존: Task 001
  - [ ] Vitest(+ `vite-tsconfig-paths`로 `@/*` 별칭) 설치, `vitest.config.ts` 작성, `npm run test` / `npm run test:watch` 스크립트 추가
  - [ ] 샘플 테스트(예: `lib/utils.ts`의 `cn()`)로 동작 확인
  - [ ] `npm run check`에 `test` 포함 여부 결정 후 반영, `.github/workflows/ci.yml`에 test 단계 추가
  - [ ] Playwright MCP E2E용 테스트 계정 2~3개와 시드 절차를 `docs/testing.md`에 정리
  - 완료 조건: 로컬과 CI에서 `npm run test`가 통과하고, CI가 실패 테스트를 잡아낸다

- **Task 006: 카카오 비즈 앱 전환 심사 신청 및 외부 설정 준비** - 우선순위 (병렬, 비개발 작업)
  - 규모: S (대기 기간은 외부 의존) | 기능 ID: F020 | 의존: 없음
  - [ ] Kakao Developers 앱 생성, 비즈 앱 전환 신청, 동의항목 `account_email` 필수 동의 심사 요청
  - [ ] Redirect URI에 Supabase 콜백(`https://<project>.supabase.co/auth/v1/callback`) 등록
  - [ ] 심사 진행 상태를 이 로드맵 Task 031에 기록(신청일, 결과)
  - [ ] 심사 전에는 카카오 버튼을 숨기는 기능 플래그 `NEXT_PUBLIC_ENABLE_KAKAO_LOGIN` 정의(기본 false)
  - 완료 조건: 심사 신청이 접수되었고, 플래그가 false일 때 카카오 버튼이 어디에도 노출되지 않는다

- **Phase 0 마무리**
  - [ ] `npm run check` 통과
  - [ ] `npm run test` 통과

### Phase 1: 그룹·초대·멤버

- **Task 007: 대시보드·그룹·초대·멤버 화면 UI 완성 (더미 데이터)**
  - 규모: M | 기능 ID: F001~F005, F022 | 의존: Task 003, 004
  - [ ] 랜딩 페이지: 서비스 소개 카피, 로그인/회원가입 버튼
  - [ ] 대시보드: 그룹 카드 목록(그룹명, 역할 배지, 다음 이벤트 요약), 빈 상태, "새 그룹 만들기" 버튼
  - [ ] 그룹 생성·설정 폼(그룹명/설명), 초대 링크 표시·복사·재발급 확인 다이얼로그
  - [ ] 초대 수락 페이지: 그룹 미리보기 카드, "그룹 가입하기" 버튼, 토큰 무효/만료 에러 상태, 이미 멤버인 경우 상태
  - [ ] 멤버 관리: 멤버 목록(이름, 역할, 가입일), 역할 변경 셀렉트, 내보내기 확인 다이얼로그
  - [ ] 그룹 홈 셸(공지/이벤트 목록 영역은 Phase 2에서 채움)
  - 완료 조건: 더미 데이터로 랜딩 → 대시보드 → 그룹 생성 → 그룹 홈 → 설정/멤버 흐름을 클릭으로 끝까지 이동할 수 있다

- **Task 008: 그룹·멤버·초대 스키마, RLS, 헬퍼 함수 구축**
  - 규모: M | 기능 ID: F001~F005 | 의존: Task 004
  - [ ] (1) 마이그레이션: `groups`, `group_members`(role CHECK, `unique(group_id, user_id)`), `group_invites`(`unique(token)`, `unique(group_id) where revoked_at is null`), 조회 인덱스
  - [ ] (2) 헬퍼 함수 `is_group_member(group_id)`, `is_group_admin(group_id)` (`security definer`, `set search_path = ''`, `stable`)
  - [ ] (2) RLS: 그룹·멤버 조회는 멤버만, 그룹 수정은 admin 이상, 멤버/초대 쓰기는 RPC 전용
  - [ ] (2) RPC: `create_group(name, description)`(그룹 + owner 멤버를 한 트랜잭션으로), `get_invite_preview(token)`(anon 허용, 그룹명·설명·유효 여부만 반환), `accept_invite(token)`(중복 가입 무시, 무효 토큰 에러), `regenerate_invite(group_id)`(기존 토큰 `revoked_at` 기록 + 신규 발급을 한 트랜잭션으로), `change_member_role(group_id, user_id, role)`, `remove_member(group_id, user_id)`
  - [ ] (2) 권한 규칙: owner는 최소 1명 유지(마지막 owner 강등·내보내기 불가), admin은 owner를 변경·내보낼 수 없음, owner 위임 시 `groups.owner_id` 동기화
  - [ ] (2) `get_advisors`로 보안 경고 0건 확인
  - [ ] (3) `generate_typescript_types`로 타입 재생성
  - 완료 조건: 비멤버 JWT로 `groups`/`group_members` 조회 시 0행, anon이 `get_invite_preview`로 그룹명·설명 외 컬럼을 얻을 수 없다

- **Task 009: 그룹 생성/수정 및 대시보드 연동**
  - 규모: M | 기능 ID: F001, F022 | 의존: Task 007, 008
  - [ ] `lib/repositories/group-repository.ts`, `lib/services/group-service.ts`, `app/(app)/groups/actions.ts`(Server Action) 구현
  - [ ] 그룹 생성 → `create_group` RPC → 그룹 홈으로 리다이렉트
  - [ ] 그룹 설정에서 그룹명/설명 수정(admin 이상), 비관리자가 URL로 접근하면 그룹 홈으로 리다이렉트
  - [ ] `groups/[groupId]/layout.tsx`에서 멤버 여부와 역할을 조회해 비멤버는 `notFound()`, 역할을 하단 탭에 주입
  - [ ] 대시보드 그룹 목록을 실데이터로 교체(다음 이벤트 요약은 Task 015에서 연결, 그 전에는 "예정 이벤트 없음")
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 그룹 생성 후 대시보드에 owner 배지와 함께 표시
    - [ ] 빈 그룹명·길이 초과 입력 시 Zod 에러 메시지 표시
    - [ ] member 계정으로 `/groups/[id]/settings` 직접 접근 시 차단
    - [ ] 비멤버 계정으로 그룹 URL 접근 시 404
  - 완료 조건: 위 시나리오 전부 통과

- **Task 010: 초대 링크 발급/재발급 및 초대 가입 플로우 구현**
  - 규모: M | 기능 ID: F002, F003 | 의존: Task 008, 009
  - [ ] `lib/supabase/proxy.ts` 공개 경로에 `/invite/*` 추가. `createServerClient`와 `getClaims()` 사이에 코드를 넣지 않고 `supabaseResponse`를 그대로 반환하는 규칙 유지
  - [ ] 비로그인 리다이렉트 시 원래 경로를 `next` 쿼리로 보존하도록 proxy 수정
  - [ ] 초대 수락 페이지: `get_invite_preview`로 미리보기, 로그인 상태면 `accept_invite` 후 그룹 홈으로, 비로그인이면 `/auth/login?next=/invite/<token>`
  - [ ] `next` 파라미터를 이메일 로그인, 회원가입(`emailRedirectTo` → `/auth/confirm?next=`), 구글 OAuth(`/auth/callback?next=`), 로그인↔회원가입 링크 이동에서 모두 유지
  - [ ] `next` 값은 `/`로 시작하는 내부 경로만 허용(`//`, 절대 URL 거부)하는 `lib/auth/safe-next.ts` 검증 함수 + 단위 테스트
  - [ ] 그룹 설정의 초대 링크 복사(Clipboard API), 재발급 시 확인 다이얼로그와 기존 링크 즉시 만료
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 비로그인으로 초대 링크 접속 → 미리보기 표시 → 가입하기 → 로그인 → 초대 페이지 복귀 → 가입 → 그룹 홈
    - [ ] 비로그인 → 회원가입(이메일 확인 링크 경유) 후에도 초대 흐름 복귀
    - [ ] 재발급 후 이전 토큰 접속 시 "만료된 초대" 에러
    - [ ] 이미 멤버인 사용자가 초대 링크 접속 시 그룹 홈으로 이동(중복 행 없음)
    - [ ] `next=https://evil.com`, `next=//evil.com` 입력 시 대시보드로 대체
  - 완료 조건: 위 시나리오 전부 통과, `safe-next` 단위 테스트 통과

- **Task 011: 멤버 역할 관리 및 내보내기 구현**
  - 규모: M | 기능 ID: F004, F005 | 의존: Task 008, 009
  - [ ] 멤버 목록 실데이터 연동(이름은 `profiles.full_name`, 없으면 이메일 앞부분)
  - [ ] 역할 변경 `change_member_role`, 내보내기 `remove_member` RPC 연동, 성공/실패 토스트
  - [ ] 내보낸 멤버의 과거 RSVP·카풀·비용·정산 기록은 보존하고, 화면에서는 "나간 멤버"로 표기하는 표시 이름 유틸(`lib/services/member-display.ts`) 작성
  - [ ] 내보내기 시 해당 그룹의 미래 `scheduled` 이벤트 RSVP 처리 방침 결정(아래 "결정 필요 사항" 1번) 후 반영
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] owner가 member를 admin으로 승격 → 해당 계정에 설정/멤버 탭 노출
    - [ ] 마지막 owner 강등·내보내기 시도 시 에러 메시지
    - [ ] admin이 owner 역할 변경 시도 시 거부
    - [ ] 내보낸 멤버가 그룹 URL 접근 시 404, 대시보드에서 그룹 사라짐
  - 완료 조건: 위 시나리오 전부 통과

- **Task 012: Phase 1 통합 테스트**
  - 규모: S | 기능 ID: F001~F005, F020, F022 | 의존: Task 009~011
  - [ ] Playwright MCP로 계정 3개(owner, admin, member) 전체 흐름: 그룹 생성 → 초대 → 가입 → 역할 변경 → 내보내기
  - [ ] RLS 교차 검증: 다른 그룹 멤버 JWT로 REST 직접 호출 시 데이터 노출 없음
  - [ ] 에러 핸들링: 네트워크 실패, 세션 만료 상태에서 Server Action 호출 시 로그인 유도
  - [ ] `npm run check` 통과

### Phase 2: 이벤트·공지·RSVP·대기자·출석

- **Task 013: 그룹 홈·이벤트 생성·이벤트 상세 UI 완성 (더미 데이터)**
  - 규모: M | 기능 ID: F006~F011 | 의존: Task 003, 004
  - [ ] 그룹 홈: 고정 공지 카드, 공지 목록, 상태별 이벤트 목록(예정/마감/완료/취소 탭 또는 필터), "이벤트 만들기" 버튼
  - [ ] 이벤트 생성 폼: "이전 이벤트 복제" 드롭다운, 제목/일시/장소/설명/정원(비우면 제한 없음)/응답 마감
  - [ ] 이벤트 상세: 정보 카드, 상태 배지와 상태 변경 메뉴(주최자), 이벤트 공지, RSVP 3버튼(참석/불참/미정), 참석자·대기자 명단(대기 순번), 출석 체크 리스트(주최자), 카풀/정산 이동 링크
  - [ ] RSVP 버튼 비활성 상태 표현(마감, 취소, 완료 이벤트)
  - 완료 조건: 더미 데이터로 정원 초과·대기자 있음·마감됨 상태를 각각 화면으로 확인할 수 있다

- **Task 014: 이벤트·RSVP·공지 스키마 및 RLS 구축**
  - 규모: M | 기능 ID: F006~F011 | 의존: Task 008
  - [ ] (1) 마이그레이션: `events`(status CHECK, `capacity >= 1` 또는 NULL, `cloned_from_event_id` 자기참조), `event_rsvps`(status CHECK, `unique(event_id, user_id)`, `waitlisted_at`, `checked_in_at`), `announcements`(`event_id` nullable, `is_pinned`), 조회 인덱스(`events(group_id, start_at)`, 대기열용 `event_rsvps(event_id, waitlisted_at) where status = 'waitlisted'`)
  - [ ] (2) 헬퍼 `is_event_member(event_id)`(이벤트의 그룹 멤버 여부), `is_event_attendee(event_id)`(`going` 여부)
  - [ ] (2) RLS: 조회는 그룹 멤버, 이벤트·공지 생성/수정/삭제는 admin 이상, `event_rsvps`는 조회만 허용하고 쓰기는 RPC 전용
  - [ ] (2) `get_advisors` 확인
  - [ ] (3) `generate_typescript_types`로 타입 재생성
  - 완료 조건: member 계정으로 `events` insert, `event_rsvps` 직접 update가 모두 거부된다

- **Task 015: 이벤트 생성(이전 이벤트 복제)·상태 관리 구현**
  - 규모: M | 기능 ID: F006, F007, F022 | 의존: Task 013, 014
  - [ ] 이벤트 생성 Server Action → service → repository, 생성 후 이벤트 상세로 이동
  - [ ] 복제: 같은 그룹의 이전 이벤트 목록 조회 → 선택 시 제목/장소/설명/정원을 채우고 일시·마감은 비워 사용자가 입력, `cloned_from_event_id` 저장
  - [ ] 검증: `rsvp_deadline <= start_at`, 정원 1 이상
  - [ ] 상태 수동 변경(admin 이상), 자동 전환 없음. 정원 증가 시 대기자 승급 RPC 호출(Task 017 연결)
  - [ ] 그룹 홈 이벤트 목록 실데이터 교체, 대시보드의 "다음 예정 이벤트 요약"(F022) 연결
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 이벤트 생성 → 상세 페이지 표시 → 그룹 홈 목록 반영 → 대시보드 요약 반영
    - [ ] 이전 이벤트 복제 시 필드 자동 채움, 원본은 변경되지 않음
    - [ ] 마감이 시작보다 늦으면 폼 에러
    - [ ] member는 상태 변경 메뉴가 보이지 않고 Server Action 직접 호출도 거부
  - 완료 조건: 위 시나리오 전부 통과

- **Task 016: 그룹·이벤트 공지 작성 및 상단 고정 구현**
  - 규모: S | 기능 ID: F008 | 의존: Task 013, 014
  - [ ] 그룹 공지(`event_id is null`)와 이벤트 공지 작성/수정/삭제(admin 이상)
  - [ ] 상단 고정 토글, 고정 공지 우선 정렬 후 최신순
  - [ ] 공지 내용은 텍스트로만 렌더(HTML 삽입 금지), 길이 제한 Zod 검증
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] admin이 공지 작성·고정 → member 화면 상단에 표시
    - [ ] 이벤트 공지가 그룹 홈에 섞이지 않음
    - [ ] member는 작성 UI가 없고 직접 insert 시 RLS 거부
  - 완료 조건: 위 시나리오 전부 통과

- **Task 017: RSVP 응답 및 대기자 자동 승급 RPC 구현**
  - 규모: L | 기능 ID: F009, F010 | 의존: Task 014, 015
  - [ ] RPC `respond_rsvp(event_id, status)`: `select ... from public.events where id = $1 for update`로 이벤트 행 잠금 → 멤버·이벤트 상태(`scheduled`)·응답 마감 확인 → `going` 요청 시 현재 `going` 수가 정원 이상이면 `waitlisted` + `waitlisted_at = now()` → 결과 상태 반환
  - [ ] `going`에서 다른 상태로 바뀌면 같은 트랜잭션에서 `waitlisted_at` 오름차순 1명을 `going`으로 승급
  - [ ] 정원 변경 시 승급 처리 함수 `promote_waitlist(event_id)`(내부 함수, 클라이언트 실행 권한 revoke)
  - [ ] 정원 축소로 `going`이 정원을 넘는 경우 강등하지 않고 승급만 멈춤(결정 필요 사항 2번에서 확정)
  - [ ] 이벤트 상세 RSVP 버튼 연동, 응답 결과(참석 확정/대기 N번) 토스트, 명단 갱신
  - 테스트 체크리스트
    - [ ] (Playwright MCP) 정원 2 이벤트에 3명 참석 → 3번째는 대기 1번 → 1명 불참 전환 → 대기자 자동 참석 확정
    - [ ] (Playwright MCP) 마감 이후·취소된 이벤트에서 응답 시도 시 에러
    - [ ] (Playwright MCP) 정원 NULL 이벤트는 대기 없이 모두 참석
    - [ ] (동시성) 정원 1 이벤트에 10개 요청 병렬 → `going`은 정확히 1건, 나머지 `waitlisted`이고 순번 중복 없음
    - [ ] (동시성) 불참 전환 2건 동시 → 대기자 2명이 순서대로 승급
  - 완료 조건: 위 시나리오 전부 통과, 어떤 경우에도 `going` 수가 정원을 넘지 않는다(정원 축소 예외 제외)

- **Task 018: 참석자 출석 체크 구현**
  - 규모: S | 기능 ID: F011 | 의존: Task 017
  - [ ] RPC `set_check_in(event_id, user_id, checked boolean)`: admin 이상, 대상이 `going`인 경우만 `checked_in_at` 설정/해제
  - [ ] 이벤트 상세 출석 체크 리스트 연동, 출석 인원 카운트 표시
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] admin이 참석자 체크 → 새로고침 후 유지
    - [ ] 대기자·불참자는 체크 대상에 없음, member는 체크 불가
  - 완료 조건: 위 시나리오 전부 통과

- **Task 019: Phase 2 통합 테스트**
  - 규모: S | 기능 ID: F006~F011, F022 | 의존: Task 015~018
  - [ ] Playwright MCP 전체 흐름: 이벤트 복제 생성 → 공지 고정 → 다수 RSVP → 대기·승급 → 마감 상태 변경 → 출석 체크 → 완료
  - [ ] RLS 교차 검증: 다른 그룹 계정으로 이벤트/RSVP/공지 조회 불가
  - [ ] 엣지 케이스: 삭제·취소된 이벤트 URL 접근, 응답 마감 직후 응답
  - [ ] `npm run check` 통과

### Phase 3: 카풀

- **Task 020: 카풀 페이지 UI 완성 (더미 데이터)**
  - 규모: S | 기능 ID: F012, F013 | 의존: Task 003, 004
  - [ ] 카풀 등록 폼(출발지, 출발 시간, 좌석 수), 내 카풀 수정/삭제
  - [ ] 카풀 카드 목록(운전자, 출발 정보, 잔여 좌석, 탑승자 목록), 탑승 신청/신청 취소 버튼, 만석 상태
  - [ ] 참석 확정자가 아닐 때 안내 화면
  - 완료 조건: 더미 데이터로 만석·잔여 있음·내가 탑승 중·내가 운전자 상태를 확인할 수 있다

- **Task 021: 카풀 스키마, RLS, 좌석 RPC 구축**
  - 규모: M | 기능 ID: F012, F013 | 의존: Task 014, 017
  - [ ] (1) 마이그레이션: `carpools`(`seat_count >= 1`, `unique(event_id, driver_id)`), `carpool_riders`(status CHECK, 부분 유니크 `unique(carpool_id, rider_id) where status = 'requested'`), 인덱스
  - [ ] (2) RLS: 조회는 `is_event_attendee`, `carpools` 쓰기는 본인(운전자)만, `carpool_riders` 쓰기는 RPC 전용
  - [ ] (2) RPC `request_carpool_seat(carpool_id)`: `carpools` 행 `for update` 잠금 → 참석 확정자·운전자 본인 아님 확인 → 잔여 좌석 확인 → 신청. `cancel_carpool_seat(carpool_id)`
  - [ ] (2) 좌석 수 축소 시 현재 탑승자 수 미만으로 줄이지 못하도록 검증
  - [ ] (2) 한 이벤트에서 여러 카풀 동시 탑승 허용 여부 결정(결정 필요 사항 3번) 후 제약 반영
  - [ ] (2) `get_advisors` 확인
  - [ ] (3) `generate_typescript_types`로 타입 재생성
  - 완료 조건: 비참석자 JWT로 카풀 조회 0행, 탑승 신청 직접 insert 거부

- **Task 022: 카풀 등록 및 탑승 신청/취소 기능 연동**
  - 규모: M | 기능 ID: F012, F013 | 의존: Task 020, 021
  - [ ] 카풀 등록/수정/삭제 Server Action 연동(탑승자가 있으면 삭제 시 확인 다이얼로그)
  - [ ] 탑승 신청/취소 RPC 연동, 잔여 좌석 실시간 반영(액션 후 재검증)
  - [ ] 운전자·탑승자가 RSVP를 `going`에서 바꿀 때 카풀 처리 방침(결정 필요 사항 4번) 반영
  - 테스트 체크리스트
    - [ ] (Playwright MCP) 운전자 등록 → 탑승자 신청 → 잔여 좌석 감소 → 취소 → 복구
    - [ ] (Playwright MCP) 만석 카풀 신청 시 에러, 운전자 본인 신청 불가
    - [ ] (Playwright MCP) 비참석자가 카풀 URL 접근 시 안내 화면
    - [ ] (동시성) 좌석 1개 카풀에 5명 병렬 신청 → 성공 1건
  - 완료 조건: 위 시나리오 전부 통과

- **Task 023: Phase 3 통합 테스트**
  - 규모: S | 기능 ID: F012, F013 | 의존: Task 022
  - [ ] Playwright MCP 흐름: RSVP 참석 → 카풀 등록 → 신청/취소 → RSVP 불참 전환 후 카풀 상태 확인
  - [ ] 좌석 수 축소 거부, 재신청(취소 후 다시 신청) 정상 동작
  - [ ] `npm run check` 통과

### Phase 4: 정산

- **Task 024: 내 프로필·정산 페이지 UI 완성 (더미 데이터)**
  - 규모: M | 기능 ID: F014, F015, F021 | 의존: Task 003, 004
  - [ ] 내 프로필: 표시 이름, 은행명, 계좌번호, 토스 송금 링크 입력과 저장, 로그아웃
  - [ ] 정산 페이지: 비용 항목 등록 폼(이름, 금액, 결제자 선택, 분담자 다중 선택), 항목 목록과 항목별 1인 분담액 미리보기
  - [ ] 정산 요약: "내가 보낼 돈 / 받을 돈" 카드(상대, 금액, 계좌 복사, 토스 링크), 송금 완료 / 입금 확인 버튼, 상태 배지
  - [ ] 잠금 상태 UI: 입금 확인된 건이 있으면 수정/삭제 비활성 + "조정 항목 추가" 버튼
  - 완료 조건: 더미 데이터로 정산 전·송금 표시·입금 확인·잠금 상태를 모두 확인할 수 있다

- **Task 025: 정산 계산 로직 구현 및 단위 테스트**
  - 규모: M | 기능 ID: F014, F015 | 의존: Task 005
  - [ ] `lib/settlement/split.ts`: 항목별 분배. 결제자가 아닌 분담자에게 `floor(amount / 분담자 수)` 청구, 나머지는 결제자 부담, 결제자 본인 몫은 송금 대상에서 제외
  - [ ] `lib/settlement/net.ts`: 이벤트 단위 (송금자, 결제자) 쌍별 합산 후 반대 방향 금액 상계, 3인 이상 순환 상계는 하지 않음, 0원 행 제거
  - [ ] `lib/settlement/diff.ts`: 기존 `settlement_transfers`와 새 계산 결과 비교(금액 변경 시 `transfer_marked_at` 초기화 대상 판정, 확인된 건 보존)
  - [ ] 조정 항목(음수 금액) 분배 규칙 확정(결정 필요 사항 5번) 후 구현
  - [ ] 모든 함수는 정수 원 단위만 다루고 부동소수점을 쓰지 않음, 입력은 Zod로 검증
  - [ ] 공통 테스트 픽스처 `lib/settlement/__fixtures__/*.json` 작성(Task 026의 SQL 구현과 동일 결과 검증에 재사용)
  - 테스트 체크리스트 (Vitest)
    - [ ] 10,000원 ÷ 3명(결제자 제외) → 3,333원씩, 결제자 1원 부담
    - [ ] 10,000원 ÷ 3명(결제자 포함) → 타인 2명만 3,333원 송금
    - [ ] 분담자가 결제자 한 명뿐 → 송금 없음
    - [ ] A→B 5,000원, B→A 3,000원 → A→B 2,000원 한 건
    - [ ] 같은 금액 양방향 → 행 없음
    - [ ] A→B, B→C, C→A 순환 → 상계하지 않고 3건 유지
    - [ ] 조정 항목(음수) 포함 시 합계 일치
    - [ ] 금액 변경 시 송금 표시 초기화 대상 판정, 금액 동일 시 유지
    - [ ] 분담자 0명, 음수 일반 항목 입력 거부
  - 완료 조건: 위 테스트 전부 통과, 정산 모듈 라인 커버리지 90% 이상

- **Task 026: payment_accounts 및 정산 스키마, RLS, RPC 구축**
  - 규모: L | 기능 ID: F014, F015, F021 | 의존: Task 014, 017, 025
  - [ ] (1) 마이그레이션: `payment_accounts`(`user_id` PK → profiles), `expenses`(금액 CHECK: `is_adjustment = false`면 0 이상), `expense_shares`(`unique(expense_id, user_id)`), `settlement_transfers`(`unique(event_id, from_user_id, to_user_id)`), 인덱스, `updated_at` 트리거(기존 패턴 재사용)
  - [ ] (2) RLS: `payment_accounts`는 본인만 조회/수정, 정산 테이블 조회는 `is_event_attendee`, 쓰기는 모두 RPC 전용
  - [ ] (2) RPC `get_payee_accounts(event_id)`: 나에게서 받을 돈이 있는 결제자의 은행명·계좌번호·토스 링크만 반환
  - [ ] (2) RPC `save_expense(...)` / `delete_expense(expense_id)`: 이벤트 행 잠금 → 참석자 확인 → 확인된 송금이 있으면 기존 항목 수정·삭제 거부(조정 항목 추가만 허용) → 분담액 계산 → `recalculate_settlement(event_id)` 호출까지 한 트랜잭션
  - [ ] (2) 내부 함수 `recalculate_settlement(event_id)`: Task 025 규칙과 동일하게 쌍별 합산·상계, 금액이 바뀐 행은 `transfer_marked_at` 초기화, 클라이언트 실행 권한 revoke
  - [ ] (2) RPC `mark_transfer_sent(transfer_id)`(송금자 본인만), `confirm_transfer(transfer_id)`(받는 사람 본인만)
  - [ ] (2) 비용 등록·수정 권한 범위 결정(결정 필요 사항 6번) 후 반영
  - [ ] (2) `get_advisors` 확인
  - [ ] (3) `generate_typescript_types`로 타입 재생성
  - 테스트 체크리스트
    - [ ] (SQL 패리티) Task 025 픽스처를 `execute_sql`로 넣어 `settlement_transfers` 결과가 TS 계산과 일치
    - [ ] (RLS) 받을 돈이 없는 사람의 계좌는 `get_payee_accounts` 결과에 없음, `payment_accounts` 직접 조회는 본인 행만
  - 완료 조건: 위 검증 통과, 확인된 송금이 있는 이벤트에서 기존 항목 수정이 DB 수준에서 거부된다

- **Task 027: 내 프로필 및 계좌 정보 관리 연동**
  - 규모: S | 기능 ID: F021 | 의존: Task 024, 026
  - [ ] 표시 이름(`profiles.full_name`) 수정, 계좌 정보 `payment_accounts` upsert
  - [ ] 토스 링크 형식 검증(https URL, 허용 도메인), 계좌번호 숫자·하이픈만 허용
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 저장 후 새로고침 시 유지, 잘못된 토스 링크 입력 시 에러
    - [ ] 다른 사용자 계정으로 내 계좌를 조회할 방법이 없음(정산 관계 없을 때)
  - 완료 조건: 위 시나리오 전부 통과

- **Task 028: 비용 항목 등록·N빵 계산·조정 항목 연동**
  - 규모: M | 기능 ID: F014 | 의존: Task 024, 026
  - [ ] 비용 항목 등록/수정/삭제 Server Action → `save_expense`/`delete_expense` RPC
  - [ ] 결제자·분담자 후보는 이벤트 `going` 참석자(나간 멤버 표기 포함)
  - [ ] 폼에서 Task 025 함수로 1인 분담액 미리보기
  - [ ] 잠금 상태에서 "조정 항목 추가"(음수 허용) 흐름
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 10,000원 3명 분담 등록 → 항목 목록과 정산 요약에 3,333원 반영
    - [ ] 항목 수정 시 정산 요약 재계산, 송금 표시만 된 건은 금액 변경 시 표시 해제
    - [ ] 입금 확인 후 기존 항목 수정·삭제 버튼 비활성, 조정 항목 추가로만 금액 정정
    - [ ] 비참석자가 정산 URL 접근 시 안내 화면
  - 완료 조건: 위 시나리오 전부 통과

- **Task 029: 정산 요약·계좌 표시·송금 완료/입금 확인 연동**
  - 규모: M | 기능 ID: F015 | 의존: Task 026, 028
  - [ ] 사람별 "누구에게 얼마" 요약(보낼 돈/받을 돈 분리), `get_payee_accounts`로 계좌·토스 링크 표시, 계좌 복사
  - [ ] 송금 완료(송금자) → 입금 확인(받는 사람) 상태 전이, 상태 배지
  - [ ] 입금 확인 취소 허용 여부 결정(결정 필요 사항 7번) 후 반영
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] A·B·C 3명 시나리오: 항목 2개 등록 → 상계된 요약 확인 → A 송금 완료 → 결제자 입금 확인 → 잠금 표시
    - [ ] 받는 사람이 아닌 계정은 입금 확인 불가, 송금자가 아닌 계정은 송금 완료 불가
    - [ ] 결제자가 계좌 미등록 시 "계좌 미등록" 안내
  - 완료 조건: 위 시나리오 전부 통과

- **Task 030: Phase 4 통합 테스트**
  - 규모: S | 기능 ID: F014, F015, F021 | 의존: Task 027~029
  - [ ] Playwright MCP 흐름: 계좌 등록 → 이벤트 참석 → 비용 여러 건 등록 → 요약 확인 → 송금/확인 → 조정 항목으로 정정
  - [ ] 동시성: 두 사용자가 같은 이벤트에 비용을 동시에 등록해도 `settlement_transfers`가 최종 비용과 일치
  - [ ] 멤버 내보내기 이후에도 정산 기록과 "나간 멤버" 표기 유지
  - [ ] `npm run test`, `npm run check` 통과

### Phase 5: 카카오 로그인·OG 메타·마무리

- **Task 031: 카카오 로그인 추가**
  - 규모: M | 기능 ID: F020 | 의존: Task 006(심사 통과), Task 010
  - 심사 기록: 신청일 ____ / 결과 ____
  - [ ] Supabase Auth에 Kakao provider 설정(REST API 키, Client Secret), 동의항목 `account_email` 요청
  - [ ] `components/kakao-login-button.tsx`: `google-login-button.tsx`와 같은 구조, `next` 파라미터 유지, 로그인·회원가입 페이지에 배치
  - [ ] `NEXT_PUBLIC_ENABLE_KAKAO_LOGIN=true`일 때만 노출
  - [ ] 이메일 미제공·동의 거부 시 `/auth/error`로 안내, 같은 이메일의 기존 계정과 연결 방식 확인(Supabase identity linking 설정)
  - [ ] `handle_new_user` 트리거가 카카오 메타데이터(닉네임)로 `full_name`을 채우는지 확인
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 카카오 로그인 → 대시보드, 초대 링크 경유 카카오 로그인 → 초대 페이지 복귀
    - [ ] 플래그 false일 때 버튼 미노출
    - [ ] 동의 거부 시 에러 페이지 안내
  - 완료 조건: 위 시나리오 전부 통과(심사 미완료 시 이 Task는 보류하고 나머지 Phase 5 진행)

- **Task 032: 초대 링크 OG 메타 및 공유 경험 개선**
  - 규모: S | 기능 ID: F003, F002 | 의존: Task 010
  - [ ] `app/invite/[token]/page.tsx`에 `generateMetadata`: `get_invite_preview`로 그룹명·설명을 제목/설명에 반영, 무효 토큰은 기본 메타
  - [ ] 초대용 동적 OG 이미지(`opengraph-image.tsx`) 또는 서비스 공통 OG 이미지로 스타터 이미지 교체
  - [ ] 카카오톡 링크 미리보기 캐시 동작 확인(카카오 공유 디버거로 캐시 초기화 절차 문서화)
  - [ ] 그룹 설정의 "카톡으로 공유" 문구 템플릿 복사 버튼
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 비로그인 상태에서 초대 URL의 `og:title`, `og:description`, `og:image` 확인
  - 완료 조건: 카톡 미리보기에 그룹명과 설명이 표시된다

- **Task 033: 에러·로딩·빈 상태 및 접근성 마무리**
  - 규모: M | 기능 ID: 전체 | 의존: Phase 1~4
  - [ ] 모든 페이지 `loading.tsx` 스켈레톤, `error.tsx`, `not-found.tsx` 정비, Server Action 실패 시 일관된 토스트 문구
  - [ ] 권한 없음(비멤버, 비관리자, 비참석자) 처리 방식 통일
  - [ ] 폼 레이블·에러 메시지 연결(`aria-describedby`), 키보드 탐색, 색 대비 점검
  - [ ] 360px~1280px 반응형 점검, 다크 모드 점검
  - 완료 조건: Playwright MCP 스냅샷 기준 주요 페이지에 접근성 경고가 없고, 모든 빈 상태에 안내 문구가 있다

- **Task 034: 성능·보안 점검 및 Vercel 배포**
  - 규모: M | 기능 ID: 전체 | 의존: Task 033
  - [ ] `get_advisors`(security, performance) 경고 0건, RLS 정책에서 `auth.uid()`를 `(select auth.uid())`로 감싸 행마다 재평가 방지, 외래키 인덱스 누락 점검
  - [ ] N+1 쿼리 점검(대시보드 그룹별 다음 이벤트는 단일 쿼리 또는 RPC로)
  - [ ] `cacheComponents` 환경에서 정적/동적 경계 점검, 사용자별 데이터가 캐시되지 않는지 확인
  - [ ] Vercel 환경 변수, Supabase Auth Site URL·Redirect URL(프로덕션/프리뷰 도메인), 구글·카카오 콘솔 Redirect URI 등록
  - [ ] CI에 test 단계 포함 확인, 에러 로깅 경로(로거) 확인
  - 완료 조건: 프로덕션 도메인에서 이메일·구글(·카카오) 로그인과 초대 흐름이 동작한다

- **Task 035: 전체 E2E 회귀 테스트 및 릴리스**
  - 규모: S | 기능 ID: F001~F022 | 의존: Task 031~034
  - [ ] PRD 사용자 여정 1~7단계를 Playwright MCP로 한 번에 실행(주최자·참여자 2계정 이상)
  - [ ] 에러·엣지 케이스 회귀: 만료 초대, 정원 초과, 만석 카풀, 정산 잠금
  - [ ] `npm run test`, `npm run check`, `npm run build` 통과
  - 완료 조건: 모든 시나리오 통과 후 `main` 배포

## 결정 필요 사항 (해당 Task 착수 전에 확정)

1. **멤버 내보내기와 미래 이벤트 RSVP** (Task 011): 내보낸 멤버의 미래 `scheduled` 이벤트 `going`/`waitlisted` 응답을 `not_going`으로 바꾸고 대기자를 승급할지, 그대로 둘지. 권장: 미래 이벤트만 정리 + 승급, 과거 기록은 보존.
2. **정원 축소 시 초과 참석자** (Task 017): 권장: 강등하지 않고 승급만 멈춤.
3. **한 이벤트에서 여러 카풀 동시 탑승** (Task 021): 권장: 이벤트당 1개만 허용(RPC에서 검증).
4. **RSVP 변경 시 카풀** (Task 022): 운전자가 불참 전환하면 카풀 자동 삭제·탑승자에게 표시, 탑승자는 자동 취소. 권장안이며 확정 필요.
5. **조정 항목(음수)의 분배** (Task 025): `floor`를 음수에 쓰면 결제자가 아닌 쪽이 1원 더 손해를 본다. 권장: 절댓값으로 나눈 뒤 부호를 붙여 나머지는 항상 결제자가 부담.
6. **비용 항목 등록·수정 권한** (Task 026): 참석자 누구나 등록, 수정·삭제는 등록자·결제자·admin. 권장안이며 확정 필요.
7. **입금 확인 취소 허용 여부** (Task 029): 권장: 받는 사람이 확인 취소 가능, 취소 시 잠금 재평가.

## 핵심 리스크

| 리스크                                                         | 영향                                 | 대응                                                                                                         |
| -------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 카카오 비즈 앱 심사 지연·반려                                  | F020 카카오 로그인 출시 지연         | Task 006을 Phase 0에서 선행 신청, 기능 플래그로 이메일·구글만 먼저 출시, Task 031만 분리 보류 가능           |
| 정산 계산의 TS/SQL 이중 구현 불일치                            | 화면 미리보기와 실제 송금액이 달라짐 | SQL RPC를 정답으로 두고, TS는 미리보기·명세 역할. 공통 픽스처로 패리티 검증(Task 025, 026)                   |
| RSVP·카풀 동시성 버그                                          | 정원·좌석 초과                       | 모든 쓰기를 `for update` 잠금 RPC로 통일, 테이블 직접 쓰기 RLS 차단, 병렬 요청 테스트 필수                   |
| 초대 토큰 유지 흐름 누락(이메일 확인, OAuth, 가입↔로그인 전환) | 초대 참여 전환율 하락                | `next` 파라미터 일원화 + 오픈 리다이렉트 검증, 경로별 E2E(Task 010)                                          |
| RLS 정책 누락·과다 노출(특히 계좌 정보)                        | 개인정보 노출                        | 계좌는 별도 테이블 + 필요한 컬럼만 반환하는 RPC, Phase별 교차 계정 검증, `get_advisors` 상시 확인            |
| `security definer` 함수의 권한 확인 누락                       | RLS 우회                             | 모든 RPC 첫 줄에서 `auth.uid()`와 멤버/역할 확인, 내부 함수는 실행 권한 revoke, 리뷰 체크리스트화            |
| Next.js 16 `cacheComponents`·`proxy.ts` 변경점                 | 세션 누락, 사용자 데이터 캐시        | 작업 전 `node_modules/next/dist/docs/` 확인, 세션 의존 컴포넌트는 Suspense 경계, Task 034에서 캐시 경계 점검 |
