# 002. 전체 라우트 구조 및 빈 페이지 생성

- ROADMAP: Task 002
- 규모: S | 기능 ID: 전체 페이지 골격 | 의존: Task 001

## 명세

PRD의 모든 화면에 해당하는 라우트를 제목만 있는 빈 페이지로 먼저 만든다. 로그인 후 화면은 `app/(app)/` route group 아래에, 초대 수락은 `app/invite/[token]`에 둔다. 경로 문자열은 `lib/constants/routes.ts`의 빌더 함수로만 만들고, 세그먼트마다 `loading`/`error`/`not-found`를 배치한다. Next.js 16에서 `params`가 Promise인 점과 `cacheComponents` 환경의 Suspense 요건을 반영한다.

## 관련 파일

| 파일                                                                                                  | 구분 | 설명                                                       |
| ----------------------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------- |
| `lib/constants/routes.ts`                                                                             | 수정 | `profile`·`newGroup` 정적 경로, 그룹·이벤트·초대 동적 빌더 |
| `components/route-states/segment-{loading,error,not-found}.tsx`                                       | 생성 | 세그먼트 상태 파일이 위임하는 공용 화면                    |
| `app/not-found.tsx`                                                                                   | 생성 | 한국어 루트 404                                            |
| `app/(app)/layout.tsx`, `groups/[groupId]/layout.tsx`, `events/[eventId]/layout.tsx`                  | 생성 | 로그인 후·그룹·이벤트 컨텍스트 레이아웃                    |
| `app/(app)/**/page.tsx` (9개), `app/invite/[token]/page.tsx`                                          | 생성 | 빈 페이지 10개                                             |
| `app/(app)`, `groups/[groupId]`, `events/[eventId]`, `invite/[token]`의 `loading/error/not-found.tsx` | 생성 | 세그먼트 상태 파일                                         |

## 수락 기준

- [x] 모든 경로가 404 없이 렌더된다
- [x] `npm run build`가 통과한다

## 구현 단계

- [x] 경로 빌더 확장 및 공용 라우트 상태 컴포넌트 작성
- [x] (app)·초대 라우트 골격과 세그먼트 상태 파일 생성
- [x] 전 경로 렌더 검증 및 로드맵 반영

## 테스트 체크리스트

- [x] `npm run build` 통과, 동적 경로는 모두 Partial Prerender(◐)
- [x] (Playwright, 로그인 상태, 360px) `/dashboard`, `/profile`, `/groups/new`, `/groups/g1`, `/groups/g1/{events/new,members,settings}`, `/groups/g1/events/e1{,/carpool,/settlement}` 렌더 확인 — Task 003 E2E에서 함께 실행
- [x] 비로그인으로 `/invite/abc`, `/groups/g1`, 없는 경로 접근 시 307 → `/auth/login`
- [ ] (로그인 상태) `/invite/[token]` 브라우저 렌더 — 미실행. 공개 경로 등록과 함께 Task 010에서 확인

## 변경 사항 요약

- 로그인 후 9개 페이지와 초대 수락 페이지, 레이아웃 3개를 만들었다. 경로는 모두 `routes` 빌더를 쓰고 동적 조각은 `encodeURIComponent`로 인코딩한다.
- 레이아웃은 `params`를 await하지 않는다. 같은 세그먼트의 `loading.tsx`는 layout을 감싸지 않아서, 레이아웃에서 await하면 static shell이 깨지기 때문이다.
- 처음에는 페이지 최상단에서 `await props.params`를 하고 세그먼트 `loading.tsx`를 Suspense 경계로 삼았다. 그런데 Task 003에서 탭으로 형제 페이지를 오갈 때 클라이언트 내비게이션이 막히는 문제가 드러났다. 그래서 `(app)` 하위 페이지는 params 읽기를 페이지 내부 Suspense(`RouteParamsText`)로 옮겼다(Task 003 커밋 `0ce32f0`).
- `app/invite/[token]/page.tsx`는 아직 최상단 await 방식이다. 탭 내비게이션 대상이 아니라 그대로 뒀고, Task 010에서 실제 미리보기를 붙일 때 정리한다.
