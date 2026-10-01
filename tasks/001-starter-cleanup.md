# 001. 스타터 킷 잔여물 제거 및 인증 리다이렉트 정리

- ROADMAP: Task 001
- 규모: S | 기능 ID: (기반), F020 | 의존: 없음

## 명세

`create-next-app --example with-supabase` 스타터에 남아 있는 예제 페이지·컴포넌트·DB 테이블을 제거하고, 인증 후 목적지를 `/protected` 하드코딩에서 `lib/constants/routes.ts`의 `DEFAULT_AUTH_REDIRECT`(`/dashboard`)로 일원화한다. 루트 메타데이터를 서비스명·한국어 설명으로 바꾼다.

## 관련 파일

| 파일                                                               | 구분   | 설명                                   |
| ------------------------------------------------------------------ | ------ | -------------------------------------- |
| `lib/constants/routes.ts`                                          | 생성   | `routes`, `DEFAULT_AUTH_REDIRECT`      |
| `lib/constants/site.ts`                                            | 생성   | 서비스명·소개 문구 `siteConfig`        |
| `app/(app)/dashboard/page.tsx`                                     | 생성   | 빈 대시보드                            |
| `components/login-form.tsx` 외 3개, `app/auth/callback/route.ts`   | 수정   | `/protected` → `DEFAULT_AUTH_REDIRECT` |
| `app/page.tsx`, `app/layout.tsx`                                   | 수정   | 한국어 랜딩, 메타데이터, `lang="ko"`   |
| `lib/supabase/proxy.ts`                                            | 수정   | 공개 경로에서 `/instruments` 제거      |
| `supabase/migrations/20260930232356_drop_instruments_table.sql`    | 생성   | `instruments` 테이블 제거              |
| `lib/supabase/database.types.ts`                                   | 재생성 | MCP `generate_typescript_types`        |
| `app/instruments`, `app/protected`, `components/tutorial/` 등 12개 | 삭제   | 스타터 잔재                            |

## 수락 기준

- [x] 삭제한 파일을 가리키는 import가 없다
- [x] 로그인 후 `/dashboard`로 이동한다 (2026-10-01 Task 003 E2E에서 실제 로그인 → `/dashboard` 도착 확인)
- [x] `database.types.ts`에 `instruments`가 없다
- [x] `npm run check`, `npm run build` 통과

## 구현 단계

- [x] 경로 상수 도입 및 인증 후 목적지를 `/dashboard`로 변경
- [x] 스타터 페이지·컴포넌트 삭제, 랜딩 재작성, proxy·메타데이터 정리
- [x] `instruments` 테이블 drop 마이그레이션 및 DB 타입 재생성
- [x] 최종 검증(로그인 E2E) 및 로드맵 반영

## 테스트 체크리스트

- [x] 잔존 참조 grep(`/protected`, `instruments`, `tutorial`, `hero`, `deploy-button`, `*-logo`) 0건
- [x] 비로그인으로 `/dashboard` 접근 시 307 → `/auth/login`
- [x] 비로그인으로 없는 경로 접근 시 307 → `/auth/login`, `/` 랜딩 200
- [x] (Playwright) 로그인 후 URL이 `/dashboard`이고 콘솔 에러 없음 — Task 003 검증 중 실행. 사용한 로그인 방식(이메일/구글)은 미기록
- [x] 구글 로그인 시작 시 Supabase에 넘기는 `redirect_to`가 `/auth/callback?next=/dashboard`임을 확인 (자동화 브라우저에서는 구글이 로그인을 거부함)
- [ ] (수동, 방식별 재확인) 구글 로그인 후 `/dashboard` 도착 — 코드상 `google-login-button`의 `next` 기본값과 `auth/callback` fallback이 `DEFAULT_AUTH_REDIRECT`임을 확인

## 변경 사항 요약

- 인증 후 목적지 5곳(`login-form`, `sign-up-form` `emailRedirectTo`, `update-password-form`, `google-login-button` `next` 기본값, `auth/callback` fallback)을 `DEFAULT_AUTH_REDIRECT`로 교체했다.
- 스타터 잔재 12개 파일을 삭제하고, 랜딩을 서비스명·소개 섹션만 있는 한국어 페이지로 다시 썼다. 서비스명·설명은 `siteConfig`에서 관리한다.
- `instruments` 테이블을 마이그레이션으로 제거하고 타입을 재생성했다(FK·뷰·함수 참조 없음, 전용 RLS 정책은 함께 삭제). 어드바이저 신규 경고 없음(기존 Auth "leaked password protection" 경고는 남아 있음).
- 참고: 로컬 마이그레이션 파일 타임스탬프와 원격 버전 번호가 다르다(MCP가 적용 시점으로 기록).
