# 테스트 가이드

이 프로젝트의 테스트는 세 종류다.

| 종류   | 대상                                           | 도구                                           |
| ------ | ---------------------------------------------- | ---------------------------------------------- |
| 단위   | 순수 로직(Zod 스키마, 응답 헬퍼, 정산 계산 등) | Vitest (`npm run test`)                        |
| E2E    | API 연동·비즈니스 로직이 있는 화면 흐름        | Playwright MCP (작업 파일의 테스트 체크리스트) |
| 동시성 | RSVP·카풀 좌석·정산 RPC                        | 병렬 요청 스크립트 또는 MCP `execute_sql`      |

## 1. 단위 테스트 (Vitest)

### 명령어

```bash
npm run test           # 한 번 실행 (CI와 같음)
npm run test:watch     # 변경 감지 모드
npm run test:coverage  # 커버리지 리포트 (터미널 + coverage/index.html)
npm run check          # typecheck + lint + format:check + test
```

- CI(`.github/workflows/ci.yml`)는 PR마다 `npm run test`를 실행한다. 테스트가 하나라도 실패하면 CI도 실패한다.
- pre-commit 훅은 테스트를 돌리지 않는다. 커밋 전에는 `npm run check`로 확인한다.

### 작성 규칙

- 테스트 파일은 소스 옆에 `<이름>.test.ts`로 둔다. 예: `lib/validations/event.ts` → `lib/validations/event.test.ts`
- `describe`/`it`/`expect`는 `vitest`에서 명시적으로 import한다(globals를 쓰지 않는다).
- import는 `@/` 별칭을 쓴다. Vite 8 내장 `resolve.tsconfigPaths`가 `tsconfig.json`의 `paths`를 해석한다.
- 테스트 이름은 한국어로, 기대 동작을 문장으로 쓴다. 예: "응답 마감이 시작보다 늦으면 rsvpDeadline 필드에 에러를 준다"
- Zod 거부 케이스는 `lib/test-utils/zod.ts`의 `fieldErrorsOf(schema, input)`로 화면에 전달될 한국어 메시지까지 검증한다.
- 환경은 `node`다. React 컴포넌트 테스트가 필요해지면 jsdom 환경을 따로 추가한다.
- 설정 파일은 `vitest.config.mts`다. `package.json`에 `"type": "module"`이 없어서 ESM 설정을 `.mts`로 둔다.

### 커버리지

- 집계 대상은 `lib/**/*.ts`다. 생성 파일(`database.types.ts`)과 테스트 헬퍼(`lib/test-utils/`)는 제외한다.
- 결과는 `coverage/`에 생기고 git에 올리지 않는다.
- 모듈별 기준은 해당 Task에서 `vitest.config.mts`의 `coverage.thresholds`에 glob으로 건다. 예: 정산 모듈 90%(Task 025)

## 2. E2E 테스트 (Playwright MCP)

### 실행 전제

1. `.env.local`에 Supabase 환경 변수가 있다(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
2. `npm run dev`로 개발 서버를 띄운다(기본 `http://localhost:3000`).
3. 아래 테스트 계정으로 **이메일 로그인**한다. 구글 로그인은 자동화 브라우저를 거부하므로 E2E에 쓰지 않는다.
4. 결과는 해당 작업 파일(`tasks/XXX-*.md`)의 "테스트 체크리스트"에 기록한다.

### 테스트 계정

역할별 시나리오(Task 009~012의 owner/admin/member 검증 등)에 쓰는 전용 계정 3개다. 실제 이메일과 비밀번호는 저장소에 올리지 않고, 로컬의 `.env.test.local`(`.gitignore`의 `.env*.local`로 제외됨)에만 둔다.

| 역할 용도 | 이메일 변수        | 비밀번호 변수         | 쓰임                                           |
| --------- | ------------------ | --------------------- | ---------------------------------------------- |
| owner     | `E2E_OWNER_EMAIL`  | `E2E_OWNER_PASSWORD`  | 그룹 생성, 초대 발급, 역할 변경·내보내기       |
| admin     | `E2E_ADMIN_EMAIL`  | `E2E_ADMIN_PASSWORD`  | 관리자 권한 확인(이벤트·공지 관리, owner 제한) |
| member    | `E2E_MEMBER_EMAIL` | `E2E_MEMBER_PASSWORD` | 일반 멤버 권한·차단 확인, 초대 수락            |

`.env.test.local` 형식:

```bash
E2E_OWNER_EMAIL=
E2E_OWNER_PASSWORD=
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
E2E_MEMBER_EMAIL=
E2E_MEMBER_PASSWORD=
```

- 역할(owner/admin/member)은 계정 속성이 아니라 그룹마다 정해진다. 아래 시드 절차로 같은 그룹 안에서 역할을 맞춘다.
- 개인 계정과 섞지 않는다. 테스트 중 그룹·이벤트·정산 데이터가 쌓이기 때문이다.

### 계정 만들기 (Supabase 대시보드)

1. Supabase 대시보드 → Authentication → Users → **Add user** → **Create new user**
2. 이메일·비밀번호를 입력하고 **Auto Confirm User**를 켠다. 확인 메일 없이 바로 로그인할 수 있다.
3. 3개를 만든 뒤 `.env.test.local`에 적는다.
4. 확인: 가입 트리거(`handle_new_user`)가 `public.profiles` 행을 만들었는지 MCP `execute_sql`로 본다.
   ```sql
   select u.email, u.email_confirmed_at is not null as confirmed, p.id is not null as has_profile
   from auth.users u left join public.profiles p on p.id = u.id
   order by u.created_at desc;
   ```
5. 표시 이름이 필요하면 각 계정으로 로그인해 내 프로필에서 "E2E Owner"처럼 구분되게 저장한다(Task 027 이후).

### 시드 절차

도메인 테이블은 각 Phase의 DB Task에서 생긴다. 테이블이 생길 때마다 이 절을 갱신한다. 시드는 RLS·RPC 규칙을 그대로 거치도록 **화면(또는 같은 RPC)으로 만든다**. SQL로 직접 넣으면 권한 검증을 건너뛰기 때문이다.

| 단계 | 생기는 시점 | 절차                                                                                         |
| ---- | ----------- | -------------------------------------------------------------------------------------------- |
| 1    | Task 009    | owner로 로그인 → 그룹 "E2E 테스트 그룹" 생성(`create_group`)                                 |
| 2    | Task 010    | owner가 그룹 설정에서 초대 링크 복사 → admin·member 계정으로 각각 초대 수락(`accept_invite`) |
| 3    | Task 011    | owner가 멤버 관리에서 admin 계정을 admin으로 변경(`change_member_role`)                      |
| 4    | Task 015    | admin이 이벤트 생성(정원 2, 응답 마감 미래)                                                  |
| 5    | Task 017    | 세 계정 모두 참석 응답 → 세 번째는 대기 1번                                                  |
| 6    | Task 022    | 참석 확정자 중 1명이 카풀 등록 → 다른 참석자가 탑승 신청                                     |
| 7    | Task 028    | 비용 항목 등록(10,000원, 3명 분담) → 정산 요약 확인                                          |

- 현재 상태(2026-10-03, Task 009): 1단계 완료. owner 계정의 "E2E 테스트 그룹"에 member 계정이 `accept_invite` RPC로 가입해 있다. admin 계정은 아직 비멤버다.
- E2E 셀렉터: Next 16은 이전에 방문한 화면을 숨긴 채 DOM에 남긴다. 여러 화면에 같은 요소(`button[type="submit"]`, `#group-name` 등)가 있으면 `:visible`로 한정한다.
- 초기화: 테스트 그룹을 지우면 하위 데이터가 cascade로 함께 지워진다(`docs/db-schema.md` §3.0). 그룹 삭제 화면이 없으므로 MCP `execute_sql`로 `delete from public.groups where name = 'E2E 테스트 그룹'`을 실행한다(실행 전 대상 확인).
- 더미 데이터(`lib/mocks/`)는 UI Task용이며 DB 시드에 쓰지 않는다.

### 브라우저가 안 뜰 때 (Playwright MCP 우회)

이 개발 맥에서는 시스템 Chrome 번들이 깨져 Playwright MCP(chrome 채널)가 시작되지 않은 적이 있다(2026-10-01).

- 대신 캐시된 Chromium(`~/Library/Caches/ms-playwright/chromium-*`)과 리비전이 맞는 `playwright` 패키지를 Node 스크립트에서 직접 불러 E2E를 돌린다. 스크립트는 scratchpad에 두고 커밋하지 않는다.
- 로그인이 필요하면 `launchPersistentContext`로 프로필 디렉터리를 만든다. 위 테스트 계정으로 이메일 로그인한 뒤 같은 프로필로 headless 검증을 돌린다.
- 구글 OAuth는 자동화 브라우저를 거부한다(`signin/rejected`). 꼭 검증해야 하면 `ignoreDefaultArgs: ["--enable-automation"]`과 `--disable-blink-features=AutomationControlled`를 주고 headed 창에서 사람이 로그인한다.
- 클라이언트 내비게이션 뒤에는 `networkidle`이 아니라 `waitForURL`로 기다린다.

## 3. 동시성 테스트

RSVP(Task 017), 카풀 좌석(Task 022), 정산 재계산(Task 030)의 RPC는 같은 행에 요청을 병렬로 보내 정원·좌석 초과가 없는지 확인한다. 방법(테스트 계정 세션으로 RPC 병렬 호출, 또는 `execute_sql`로 여러 세션 시뮬레이션)은 해당 Task에서 정하고 이 절에 추가한다.
