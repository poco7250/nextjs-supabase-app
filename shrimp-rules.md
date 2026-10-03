# Development Guidelines

> AI 에이전트 전용 작업 규칙. 일반 개발 지식은 적지 않는다. 규칙이 `CLAUDE.md`, `docs/ROADMAP.md`와 충돌하면 **실제 코드 > ROADMAP 공통 규칙 > 이 문서** 순으로 따른다.

## 프로젝트 개요

- 목적: 모임 이벤트 관리 웹 MVP(그룹·초대·이벤트·RSVP·카풀·정산). 요구사항은 `docs/PRD.md`, 작업 순서는 `docs/ROADMAP.md`에 있다.
- 기반: `create-next-app --example with-supabase` 스타터에서 출발했다.
- 스택: **Next.js 16**(App Router, `cacheComponents: true`), React 19, TypeScript 5, `@supabase/ssr` 쿠키 인증, **Tailwind CSS v3**, shadcn/ui(new-york, lucide), Node >= 22(`.nvmrc` = 22).
- 도입 예정이고 아직 없는 것: Zod, Vitest(`npm run test`), `lib/logger.ts`, `lib/services/`, `lib/repositories/`, `tasks/`. 처음 필요해지는 Task에서 만든다.

## 디렉터리 구조

| 경로                                 | 용도                                               | 규칙                                                            |
| ------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------- |
| `app/`                               | 라우트(페이지, Route Handler)                      | `src/` 디렉터리를 만들지 않는다                                 |
| `app/auth/*`                         | 인증 페이지, `callback`(OAuth), `confirm`(OTP)     | 공개 경로다                                                     |
| `app/docs/guides/*.md`               | 범용 가이드(Next 15, Tailwind v4, react-hook-form) | **참고만 한다.** 여기 나온 API, 구조, 문법을 그대로 쓰지 않는다 |
| `components/ui/`                     | shadcn 컴포넌트                                    | shadcn CLI나 MCP로만 추가한다                                   |
| `components/*.tsx`                   | 앱 컴포넌트, `*-form.tsx`는 인증 폼                | 파일명은 kebab-case, export 이름은 PascalCase                   |
| `lib/supabase/`                      | Supabase 클라이언트 3종 + `database.types.ts`      | 아래 Supabase 규칙 참고                                         |
| `lib/services/`, `lib/repositories/` | 비즈니스 규칙 / Supabase 쿼리·RPC(예정)            | 레이어드 구조 규칙 참고                                         |
| `supabase/migrations/`               | 스키마 변경 SQL                                    | `<YYYYMMDDHHMMSS>_<설명>.sql`                                   |
| `proxy.ts`(루트)                     | Next 16 proxy 진입점                               | `lib/supabase/proxy.ts`의 `updateSession()`만 호출한다          |
| `docs/PRD.md`, `docs/ROADMAP.md`     | 요구사항과 로드맵                                  | 기능 범위를 판단할 때 기준 문서로 쓴다                          |
| `tasks/XXX-description.md`           | 작업 명세(예정)                                    | 워크플로우 규칙 참고                                            |
| `.claude/`                           | 에이전트, 커맨드, 훅, 권한                         | 훅이나 권한을 바꾸려면 사용자 승인을 받는다                     |
| `shrimp_data/`                       | shrimp-task-manager 데이터                         | 직접 편집하지 않는다(ESLint 무시 대상)                          |

- 경로 별칭은 `@/*` → 저장소 루트다. 예: `@/lib/supabase/server`, `@/components/ui/button`.

## 코드 규칙

- 주석, JSDoc, 문서, UI에 새로 넣는 한국어 메시지는 **한국어**로 쓴다.
- 모든 함수에 짧은 JSDoc을 붙인다. 참고 예시: `app/auth/callback/route.ts`.
- 함수는 30줄 이하로 유지한다. 넘으면 헬퍼로 쪼갠다(`getSafeNext`, `redirectToError` 패턴).
- 변수와 함수는 camelCase로 쓴다. 외부 API 필드명(`token_hash` 등)은 예외다.
- 타입만 가져올 때는 `import type` 또는 inline `type`을 쓴다(ESLint `consistent-type-imports`).
- 사용하지 않는 인자나 변수에는 `_` 접두사를 붙인다.
- 포맷은 Prettier가 정한다: 큰따옴표, 세미콜론, trailing comma, 80자. Tailwind 클래스 순서는 손으로 맞추지 않는다(`cn`, `cva` 인자도 자동 정렬된다).
- `console.log` 금지. 지금은 `console.error`/`console.warn`에 `[모듈명]` 접두사를 붙인다(예: `"[auth/callback] 세션 교환 실패:"`). `lib/logger.ts`가 생기면 로거로 바꾼다.

## Next.js 16 규칙

- 코드를 쓰기 전에 `node_modules/next/dist/docs/`에서 해당 API 문서를 확인한다. 학습 데이터에 있는 Next 13~15 방식을 그대로 쓰지 않는다.
- `middleware.ts`를 만들지 않는다. 요청 가로채기는 루트 `proxy.ts`의 `proxy()`에서 처리한다.
- `cacheComponents: true` 환경이다. 쿠키, 세션, `createClient()`(server)를 쓰는 async 컴포넌트는 반드시 `<Suspense>` 안에 둔다.
  - 해도 됨: 페이지는 동기 컴포넌트로 두고, 안쪽의 `async function XxxData()`를 `<Suspense>`로 감싼다(예: `app/page.tsx`의 `<Suspense><AuthButton /></Suspense>`).
  - 하면 안 됨: 페이지 최상위에서 바로 `await createClient()`를 호출하고 Suspense 없이 렌더링한다.
- 사용자별 데이터를 캐시되는 영역(`"use cache"`)에 넣지 않는다.

## Supabase 규칙

### 클라이언트 선택

| 실행 위치                                      | import                                   | 비고                                     |
| ---------------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| Client Component(`"use client"`)               | `@/lib/supabase/client`의 `createClient` | 동기 함수                                |
| Server Component, Server Action, Route Handler | `@/lib/supabase/server`의 `createClient` | **`await` 필수.** 전역에 캐싱하지 않는다 |
| proxy                                          | `@/lib/supabase/proxy`의 `updateSession` | 다른 곳에서 호출하지 않는다              |

- 서버에서 인증을 확인할 때는 `supabase.auth.getClaims()`를 쓴다. `getSession()`의 결과를 권한 판단에 쓰지 않는다.
- 환경 변수 이름은 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`다. `ANON_KEY`라는 이름을 쓰지 않는다.
- `.env*` 파일은 읽거나 수정하지 않는다(권한 deny). 필요한 값은 사용자에게 요청한다.

### proxy (`lib/supabase/proxy.ts`)

- ⚠️ `createServerClient(...)`와 `supabase.auth.getClaims()` 사이에 코드를 넣지 않는다.
- ⚠️ `supabaseResponse`를 그대로 반환한다. 새 응답을 만들어야 하면 쿠키를 복사한다.
- 공개 경로 화이트리스트는 `/`, `/login*`, `/auth*`이며 `if` 조건에 하드코딩되어 있다. **비로그인 사용자가 접근해야 하는 페이지(예: 초대 수락)를 추가하면 이 조건에도 경로를 추가한다.**

### DB 작업 순서 (순서 변경 금지)

1. `supabase/migrations/<timestamp>_<설명>.sql`을 작성하고, 같은 SQL을 Supabase MCP `apply_migration`으로 반영한다. 파일 없이 MCP로만 반영하지 않는다.
2. RLS와 함수를 설정한다.
   - 모든 테이블에 `enable row level security`를 켠다. 정책의 `auth.uid()`는 `(select auth.uid())`로 감싼다.
   - 함수는 `security definer` + `set search_path = ''`로 만들고, 테이블은 `public.xxx`처럼 스키마를 붙여 참조한다.
   - RPC는 첫 부분에서 `auth.uid()`와 멤버/역할을 확인한다.
   - 트리거 전용 함수는 `public, anon, authenticated`의 실행 권한을 revoke한다. 클라이언트용 RPC만 필요한 역할에 grant한다.
   - 반영한 뒤 MCP `get_advisors`(security, performance)를 실행하고 경고를 해결한다.
3. MCP `generate_typescript_types`의 결과로 `lib/supabase/database.types.ts` 전체를 덮어쓴다. **이 파일을 직접 수정하지 않는다.**

- 동시성이 걸린 쓰기(RSVP, 대기자 승급, 카풀 좌석, 정산 재계산)는 `select ... for update`로 잠그는 RPC로만 처리하고, 해당 테이블에는 insert/update RLS 정책을 주지 않는다.
- 반복되는 권한 확인은 `is_group_member(group_id)`, `is_group_admin(group_id)` 헬퍼로 묶어 재사용한다.
- 참고: `instruments` 테이블은 마이그레이션 파일 없이 만들어졌고, Phase 0에서 정리할 예정이다. 새 코드에서 쓰지 않는다.

## 기능 구현 규칙

### 레이어드 구조 (새 도메인 기능)

- 흐름: Server Action / Route Handler → `lib/services/*` → `lib/repositories/*`.
- repository만 Supabase 쿼리와 RPC를 호출한다. 컴포넌트와 Server Action에서 `supabase.from()`을 직접 호출하지 않는다.
- 입력은 Zod 스키마로 검증한 DTO로 넘긴다.
- Server Action은 항상 아래 형식을 반환한다. 예외를 클라이언트로 던지지 않는다.

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
```

- 예외: 기존 스타터 인증 폼(`components/*-form.tsx`)은 브라우저 클라이언트를 직접 쓰는 구조를 유지해도 된다.

### 인증 리다이렉트

- `next` 파라미터를 받는 곳에서는 오픈 리다이렉트를 막는다. `/`로 시작하고 `//`로 시작하지 않는 값만 허용한다(`app/auth/callback/route.ts`의 `getSafeNext`). 새로 만들 때는 이 함수를 공용 유틸로 옮겨서 재사용한다.
- 로그인 후 기본 목적지는 `lib/constants/routes.ts`의 `DEFAULT_AUTH_REDIRECT`다. 목적지를 바꿀 때는 이 상수만 바꾼다. 컴포넌트에 경로 문자열을 하드코딩하지 않는다.
  - 사용처: `components/login-form.tsx`, `components/sign-up-form.tsx`, `components/update-password-form.tsx`, `components/google-login-button.tsx`, `app/auth/callback/route.ts`

### UI

- shadcn 컴포넌트는 `components/ui/`에 먼저 있는지 확인하고, 없으면 shadcn MCP의 `get_add_command_for_items`로 명령을 받아 추가한다.
- 클래스 합성은 `@/lib/utils`의 `cn()`을 쓴다.
- 아이콘은 `lucide-react`만 쓴다.
- Tailwind v4 문법(`@theme`, `@import "tailwindcss"`, CSS 기반 설정)을 쓰지 않는다. 설정은 `tailwind.config.ts`, 색상 토큰은 `app/globals.css`의 CSS 변수를 쓴다.
- 폼 라이브러리(react-hook-form 등)는 설치되어 있지 않다. 추가하려면 사용자 승인을 받는다.

## 품질 게이트

- Edit/Write를 하면 PostToolUse 훅이 Prettier와 `eslint --fix`를 실행한다. 훅이 에러를 알려주면 바로 고친다.
- 작업을 마무리하기 전에 `npm run check`(typecheck + lint + format:check)를 실행한다.
- CI는 `--max-warnings=0`이다. 경고도 남기지 않는다.
- pre-commit(husky)이 lint-staged와 전체 typecheck를 실행한다. `--no-verify`를 쓰지 않는다.

## 동시 수정이 필요한 파일

| 이걸 바꾸면                   | 같이 바꿀 것                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------- |
| DB 스키마(테이블, 컬럼, 함수) | 마이그레이션 SQL 파일 + MCP 반영 + `database.types.ts` 재생성                   |
| 비로그인 공개 페이지 추가     | `lib/supabase/proxy.ts`의 공개 경로 조건                                        |
| 로그인 후 목적지              | `lib/constants/routes.ts`의 `DEFAULT_AUTH_REDIRECT`만 변경                      |
| 새 npm 스크립트나 도구 추가   | `package.json` + `CLAUDE.md`의 명령어 섹션(필요하면 `.github/workflows/ci.yml`) |
| 아키텍처나 규칙 변경          | `CLAUDE.md` + 이 문서(`shrimp-rules.md`)                                        |
| Task 완료                     | `tasks/XXX-*.md`의 체크박스와 변경 요약 + `docs/ROADMAP.md`의 ✅ 표시           |
| PRD 기능 범위 변경            | `docs/PRD.md` + `docs/ROADMAP.md`의 해당 Task                                   |

## 작업 워크플로우

1. `docs/ROADMAP.md`에서 다음 Task와 "결정 필요 사항"을 확인한다. 미결정 항목이 걸려 있으면 착수하기 전에 사용자에게 확정을 받는다.
2. `tasks/XXX-description.md`를 만든다(3자리 번호, 첫 작업이면 `tasks/000-sample.md`도 함께). 명세, 관련 파일, 수락 기준, 구현 단계를 적는다. API나 비즈니스 로직 작업이면 `## 테스트 체크리스트`(Playwright MCP 시나리오)를 넣는다.
3. 단계별로 구현하고, 단계마다 작업 파일의 진행 상황을 갱신한다. **단계가 끝날 때마다 멈추고 지시를 기다린다.**
4. API나 비즈니스 로직은 Playwright MCP로 E2E 검증을 하고, 순수 로직은 Vitest로 검증한다.
5. 완료되면 `/docs:update-roadmap`으로 ROADMAP을 갱신한다.

- 브랜치: `feature/<기능명>`. `main`에서 직접 작업하지 않는다.
- 커밋: `<이모지> <타입>: <한글 설명>` 형식(`/git:commit`)에, `Co-Authored-By` 트레일러를 붙인다.

## AI 판단 기준

- 라이브러리나 프레임워크 API가 헷갈리면: Next.js는 `node_modules/next/dist/docs/`를 먼저 보고, 그 밖의 라이브러리는 Context7 MCP로 확인한다. 추측으로 쓰지 않는다.
- Supabase 문제를 디버깅할 때는 MCP `query_logs`와 `get_advisors`를 먼저 확인하고 코드를 고친다.
- 새 파일을 어디에 둘지:
  - DB 접근 → `lib/repositories/`
  - 도메인 규칙이나 계산 → `lib/services/`(정산처럼 순수 계산이면 테스트를 함께 만든다)
  - 입력 검증 스키마 → 해당 service 옆, 또는 `lib/validations/`
  - 재사용 UI → `components/`, 한 라우트에서만 쓰는 UI → 해당 `app/` 경로의 `_components/`
- 정산 계산은 SQL RPC 결과를 정답으로 둔다. TS 구현은 미리보기용이며, SQL과 결과가 다르면 SQL을 기준으로 맞춘다.
- 요청이 PRD의 "MVP 이후 기능(제외)"에 해당하면 구현하기 전에 사용자에게 알린다.
- 서비스명·소개 문구가 필요하면 `lib/constants/site.ts`의 `siteConfig`를 쓴다. 문자열을 새로 하드코딩하지 않는다.

## 금지 사항

- ❌ `middleware.ts` 생성, `src/` 디렉터리 생성
- ❌ `lib/supabase/database.types.ts` 직접 수정
- ❌ 마이그레이션 파일 없이 스키마 변경, RLS 없는 테이블 생성
- ❌ `search_path`를 지정하지 않은 `security definer` 함수, 트리거 함수의 실행 권한 방치
- ❌ server `createClient()`를 모듈 전역에 캐싱하거나 `await` 없이 사용
- ❌ proxy에서 `createServerClient`와 `getClaims()` 사이에 코드 추가, 쿠키를 복사하지 않은 새 응답 반환
- ❌ 동시성 쓰기(RSVP, 카풀 좌석, 정산)를 테이블에 직접 insert/update
- ❌ 검증하지 않은 `next` 값으로 리다이렉트
- ❌ `console.log`, `--no-verify`, `git push --force`, `rm -rf`
- ❌ `.env*` 파일 읽기/수정, 비밀 키(service_role)를 클라이언트 코드에 노출
- ❌ `app/docs/guides/`의 Next 15 / Tailwind v4 / react-hook-form 예제를 그대로 복사
