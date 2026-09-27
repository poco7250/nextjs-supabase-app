# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개요

Next.js + Supabase 스타터 킷(`create-next-app --example with-supabase`) 기반 앱. App Router, `@supabase/ssr` 쿠키 기반 인증, Tailwind CSS v3 + shadcn/ui(new-york, lucide 아이콘)를 사용한다.

- 설치된 Next.js는 **16.x** (`package.json`은 `"next": "latest"`). `next.config.ts`에서 `cacheComponents: true`가 켜져 있다.
- `app/docs/guides/*.md`는 Next.js 15.5.3 / `src/` 구조 / Tailwind v4 / react-hook-form 기준으로 작성된 범용 가이드라서 이 저장소의 실제 구성과 다르다. 참고만 하고 실제 코드를 우선한다.

## 명령어

```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드 (타입 체크 포함)
npm run lint        # eslint . (flat config: core-web-vitals + typescript + prettier)
npm run lint:fix    # 자동 수정
npm run format      # prettier --write . (Tailwind 클래스 자동 정렬 포함)
npm run typecheck   # next typegen && tsc --noEmit
npm run check       # typecheck + lint + format:check (작업 마무리 전 실행)
```

테스트 러너는 아직 설정되어 있지 않다.

### 품질 게이트

- **Claude Code 훅**: `.claude/settings.json`의 PostToolUse 훅(`.claude/hooks/format-lint-hook.sh`)이 Edit/Write 직후 해당 파일에 Prettier + `eslint --fix`를 돌린다. 자동 수정 안 되는 에러가 남으면 피드백이 오니 바로 고친다.
- **pre-commit**: husky + lint-staged로 스테이징된 파일을 린트/포맷하고, 전체 `typecheck`를 실행한다. `--no-verify`로 우회하지 않는다.
- **CI**: `.github/workflows/ci.yml`에서 PR마다 typecheck / lint(`--max-warnings=0`) / format:check.
- `console.log`는 ESLint 경고 대상이다(`console.warn`/`error`만 허용).

환경 변수(`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. 값이 없으면 `lib/utils.ts`의 `hasEnvVars`가 false가 되어 proxy 인증 검사를 건너뛰고 UI에 `EnvVarWarning`이 표시된다.

## 아키텍처

### Supabase 클라이언트 (`lib/supabase/`)

용도별로 세 가지 클라이언트가 있고, 반드시 맞는 것을 써야 한다.

- `client.ts` — `createBrowserClient<Database>`. Client Component(`"use client"`)용.
- `server.ts` — `createServerClient<Database>` + `next/headers`의 `cookies()`. Server Component, Route Handler, Server Action용. **async 함수**이며, Fluid compute 때문에 전역 변수에 캐싱하지 말고 함수마다 새로 생성한다.
- `proxy.ts` — `updateSession()`. 요청마다 세션을 갱신하고 비로그인 사용자를 리다이렉트한다.

### Proxy (구 middleware)

Next.js 16에서는 middleware 대신 루트의 `proxy.ts`가 `proxy()` 함수를 export한다. 이 함수가 `lib/supabase/proxy.ts`의 `updateSession()`을 호출한다.

- 공개 경로 화이트리스트는 `updateSession()` 안에 하드코딩되어 있다: `/`, `/login*`, `/auth*`, `/instruments`, `/instruments/*`. 그 외 경로는 비로그인 시 `/auth/login`으로 리다이렉트된다. **새 공개 페이지를 추가하면 여기에 경로를 추가해야 한다.**
- `createServerClient`와 `supabase.auth.getClaims()` 사이에 코드를 넣지 말고, `supabaseResponse` 객체를 그대로 반환해야 한다(쿠키 동기화가 깨지면 사용자가 랜덤하게 로그아웃됨).

### 인증 흐름

- 인증 UI는 `components/*-form.tsx`(Client Component, 브라우저 클라이언트 사용)와 `app/auth/*` 페이지로 구성된다.
- 이메일 확인/비밀번호 재설정 링크는 `app/auth/confirm/route.ts`에서 `verifyOtp({ token_hash, type })`로 처리하고 `next` 파라미터로 리다이렉트한다.
- `app/protected/`는 로그인이 필요한 영역 예시.

### 데이터베이스

- 마이그레이션: `supabase/migrations/*.sql`. 현재 `profiles` 테이블(auth.users와 1:1, RLS 적용)과 트리거들(`handle_new_user`로 가입 시 프로필 자동 생성, 이메일 변경 동기화, `updated_at` 자동 갱신)이 정의되어 있다. 트리거 함수는 `security definer` + `set search_path = ''`이고 RPC 실행 권한을 revoke한다 — 새 함수도 같은 패턴을 따른다.
- 타입: `lib/supabase/database.types.ts`는 Supabase에서 생성한 파일이다(현재 `instruments`, `profiles`). 스키마를 바꾸면 Supabase MCP의 `generate_typescript_types`로 다시 생성하고, 직접 수정하지 않는다.
- Supabase 프로젝트는 `.mcp.json`의 supabase MCP 서버(project_ref 지정)로 연결되어 있다. 스키마 변경은 마이그레이션 파일로 남긴다.

### 경로 별칭

`@/*` → 저장소 루트 (`src/` 디렉터리 없음). shadcn 컴포넌트는 `components/ui/`, 유틸은 `lib/utils.ts`(`cn()`).

## 프로젝트 도구

- `.claude/agents/`, `.claude/commands/`(git commit/branch/pr/merge, docs/update-roadmap)에 프로젝트 전용 서브에이전트와 커맨드가 있다.
- `shrimp_data/`는 shrimp-task-manager MCP의 작업 데이터 디렉터리다.
