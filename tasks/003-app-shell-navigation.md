# 003. 공통 레이아웃 및 하단 탭 내비게이션 구현

- ROADMAP: Task 003
- 규모: M | 기능 ID: 메뉴 구조 전체 | 의존: Task 002

## 명세

로그인 후 영역(`app/(app)/`)에 모바일 우선 앱 셸을 만든다. 상단 헤더(뒤로 가기, 페이지 제목, 테마·컨텍스트 메뉴)와 하단 탭 바를 두고, 탭 구성은 공통 / 그룹 내부 / 이벤트 내부 컨텍스트에 따라 바뀐다. 관리자 전용 탭은 `role` props로 노출을 정해 Phase 1에서 실제 역할만 주입하면 되게 한다. 이후 화면 작업에 쓸 shadcn/ui 컴포넌트와 폼 필드 래퍼, 토스트도 함께 준비한다.

## 관련 파일

| 파일                                                                                                  | 구분 | 설명                                                                        |
| ----------------------------------------------------------------------------------------------------- | ---- | --------------------------------------------------------------------------- |
| `components/ui/{dialog,alert-dialog,sheet,select,textarea,tabs,avatar,separator,skeleton,sonner}.tsx` | 생성 | shadcn/ui (Tailwind v3용, `shadcn@2.3.0`)                                   |
| `components/form-field.tsx`                                                                           | 생성 | 레이블·설명·에러를 `aria-describedby`로 연결하는 필드 래퍼(form 대체)       |
| `components.json`                                                                                     | 수정 | `tailwind.config`를 `tailwind.config.ts`로 지정(CLI의 v4 오인 방지)         |
| `lib/navigation/tabs.ts`                                                                              | 생성 | `GroupRole`, 컨텍스트 판정, 탭 구성, 활성 판정                              |
| `lib/navigation/page-meta.ts`                                                                         | 생성 | 경로별 헤더 제목, 뒤로 가기 목적지                                          |
| `lib/mocks/dummy-role.ts`                                                                             | 생성 | 더미 역할 `DUMMY_GROUP_ROLE` (Task 009에서 제거)                            |
| `components/layout/{bottom-tab-nav,app-header,nav-skeleton}.tsx`                                      | 생성 | 하단 탭 바, 상단 헤더, Suspense fallback                                    |
| `hooks/use-logout.ts`                                                                                 | 생성 | 로그아웃 후 랜딩 이동, 실패 시 토스트                                       |
| `components/logout-button.tsx`, `components/theme-switcher.tsx`                                       | 수정 | 한국어·`useLogout` 사용 / `className`·`aria-label` 추가                     |
| `app/layout.tsx`                                                                                      | 수정 | `<Toaster />` 배치                                                          |
| `app/(app)/layout.tsx`, `groups/[groupId]/layout.tsx`, `events/[eventId]/layout.tsx`                  | 수정 | 헤더·셸 `main`·컨텍스트별 탭 바 연결                                        |
| `components/route-states/route-params-text.tsx`                                                       | 생성 | 골격 페이지의 params 표시를 페이지 내부 Suspense로 감쌈                     |
| `app/(app)/**/page.tsx`                                                                               | 수정 | `main`→`section`, `h1`→`h2`, params 읽기를 Suspense 안으로, 프로필 로그아웃 |

## 수락 기준

- [x] 360px 폭에서 가로 스크롤 없이 모든 탭이 보인다
- [x] 더미 역할을 바꾸면 관리자 탭 노출이 바뀐다 (owner 4개 / member 1개)
- [x] 로그아웃은 내 프로필 페이지와 헤더 메뉴에 있고, 로그아웃 후 랜딩으로 이동한다
- [x] 다크 모드 유지, 터치 영역 44px 이상, 활성 탭 `aria-current="page"`
- [x] `npm run check`, `npm run build` 통과

## 구현 단계

- [x] shadcn 컴포넌트 추가, Toaster 배치, 로그아웃 훅 정리
- [x] 내비게이션 순수 로직과 BottomTabNav·AppHeader 컴포넌트 구현
- [x] 컨텍스트 레이아웃에 앱 셸 연결 및 프로필 로그아웃 배치
- [x] 360px 반응형·역할 탭 검증 및 로드맵 반영

## 테스트 체크리스트

> Playwright(캐시된 Chromium 1243, 360×740) 스크립트로 실행했다. Playwright MCP는 시스템 Chrome 번들이 깨져 있어 실행되지 않았다.

- [x] 10개 경로(`/dashboard`, `/profile`, `/groups/new`, 그룹 4개, 이벤트 3개)에서 `scrollWidth <= 360`, 탭 바 1개, 기대 탭 수, 탭 높이 56px, 헤더 버튼 44px, 활성 탭 1개(`/groups/new`는 0개), `h1` 1개(헤더 제목)
- [x] 뒤로 가기: 카풀 → 이벤트 상세 → 그룹 홈 → 대시보드, 대시보드에서는 버튼 없음
- [x] 탭 클릭 이동 후 활성 탭 변경 (그룹 홈 → 멤버)
- [x] `DUMMY_GROUP_ROLE = "member"`일 때 그룹 탭 1개(그룹 홈), `"owner"`일 때 4개 (검증 후 owner로 원복)
- [x] 헤더 메뉴 로그아웃 → `/`, 이후 `/dashboard` 접근 시 `/auth/login`
- [x] 라이트/다크 전환 스크린샷에서 헤더·탭 바 대비 정상
- [x] 위 시나리오 전체에서 콘솔 에러 없음
- [ ] (수동) 프로필 페이지의 로그아웃 버튼 — 헤더와 같은 `useLogout` 훅을 쓰며 자동 검증은 헤더 경로로만 했다

## 변경 사항 요약

- `shadcn@latest`가 `components.json`의 빈 `tailwind.config`를 보고 Tailwind v4용 코드를 생성해서, 되돌리고 `shadcn@2.3.0`으로 다시 설치했다. 재발을 막으려고 `tailwind.config`를 `tailwind.config.ts`로 지정했다. v3 레지스트리에 `field`가 없어 `components/form-field.tsx`를 직접 만들었다.
- 하단 탭 바는 레이아웃마다 하나씩 두고, URL의 `groupId`/`eventId`로 판정한 컨텍스트가 자기 것과 다르면 `null`을 반환한다. 그래서 가장 안쪽 컨텍스트의 탭 바만 보인다. 역할은 `role` props로 받으며, 지금은 그룹 레이아웃이 `DUMMY_GROUP_ROLE`을 넘긴다.
- 헤더·탭 바는 `usePathname`/`useParams`를 쓰므로 `cacheComponents` 환경에서 Suspense로 감쌌다(동적 경로 prerender 요건).
- Task 002 페이지들은 `await params`를 페이지 최상단에서 했는데, 탭으로 형제 페이지를 오갈 때 Next 16이 "runtime data outside Suspense"(즉시 내비게이션 차단) 에러를 냈다. 클라이언트 내비게이션은 공유 레이아웃 아래만 다시 그려서 이미 떠 있는 상위 `loading.tsx`가 fallback이 되지 못하기 때문이다. 페이지를 동기로 바꾸고 params 읽기를 `RouteParamsText` 내부 Suspense로 옮겨 해결했다.
- 페이지 `<main>`/`<h1>`은 셸 `<main>`, 헤더 `<h1>`과 겹쳐서 `<section>`/`<h2>`로 바꿨다.
- 로그아웃은 `hooks/use-logout.ts`로 모았다. 성공 시 `routes.home`으로 `replace` 후 `refresh`, 실패 시 토스트와 `console.error`(logger는 Task 004)를 남긴다.
- 참고: 구글 로그인은 자동화 브라우저에서 구글이 거부해서(`signin/rejected`), 자동화 플래그를 끈 창에서 다시 로그인한 뒤 검증했다. `app/invite/[token]/page.tsx`는 탭 내비게이션 대상이 아니라서 이번에 손대지 않았다.
