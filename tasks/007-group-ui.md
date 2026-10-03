# 007. 대시보드·그룹·초대·멤버 화면 UI 완성 (더미 데이터)

- ROADMAP: Task 007
- 규모: M | 기능 ID: F001~F005, F022 | 의존: Task 003, 004

## 명세

Phase 1 화면(랜딩, 대시보드, 그룹 생성·설정, 초대 수락, 멤버 관리, 그룹 홈 셸)을 `lib/mocks`의 더미 데이터로 완성한다. 폼은 실제와 같은 형태(`useActionState` + Zod + `ActionResult`)로 만들고, DB 대신 검증과 권한 규칙만 거치는 목 Server Action에 연결한다. 연동 Task(009~011)에서는 액션과 데이터 조회만 실제 구현으로 바꾼다.

결정 사항:

- 목 Server Action(`lib/mocks/actions.ts`)으로 폼을 처리한다. 검증 실패는 `fromZodError`, 권한 위반은 `fail("FORBIDDEN" | "CONFLICT")`로 돌려준다.
- 역할은 그룹별 더미 역할(`getMockRole(groupId, MOCK_CURRENT_USER_ID)`)을 쓴다. 등반 모임은 owner, 독서 모임은 member다. `lib/mocks/dummy-role.ts`는 제거한다.
- 멤버 권한 규칙은 순수 함수(`lib/groups/member-permissions.ts`)로 만든다. `docs/db-schema.md`의 RPC 규칙과 맞추고 단위 테스트한다.
- `cacheComponents` 때문에 페이지는 동기 함수로 두고, params·searchParams 접근은 Suspense 안 async 컴포넌트에서 한다. 레이아웃 최상단에서는 params를 await하지 않는다.
- `/invite/*` 공개 경로와 `next` 파라미터는 Task 010 범위다.

## 관련 파일

| 파일                                                                    | 구분 | 설명                                                                  |
| ----------------------------------------------------------------------- | ---- | --------------------------------------------------------------------- |
| `lib/groups/member-permissions.ts`                                      | 생성 | 역할 변경·내보내기 권한 규칙 + 테스트                                 |
| `lib/format/date.ts`                                                    | 생성 | KST 날짜·일시 표시 + 테스트                                           |
| `lib/mocks/actions.ts`                                                  | 생성 | 목 Server Action 6종                                                  |
| `lib/mocks/dummy-role.ts`                                               | 삭제 | 그룹별 더미 역할로 대체                                               |
| `hooks/use-action-toast.ts`                                             | 생성 | Server Action 결과 토스트(필드 에러는 폼에 표시)                      |
| `lib/types/action-result.ts`                                            | 수정 | `ActionState<T>` (useActionState 상태 타입)                           |
| `lib/constants/routes.ts`                                               | 수정 | `signUp` 경로 추가                                                    |
| `components/empty-state.tsx`, `components/groups/*`                     | 생성 | 빈 상태, 역할 배지, 그룹 카드, 그룹 폼, 초대 링크, 멤버 목록          |
| `app/page.tsx`, `components/auth-button.tsx`                            | 수정 | 랜딩 카피·기능 소개·로그인 상태별 버튼, AuthButton 한국어·routes 사용 |
| `app/(app)/dashboard/page.tsx`                                          | 수정 | 그룹 카드 목록, 빈 상태                                               |
| `app/(app)/groups/new/page.tsx`                                         | 수정 | 그룹 생성 폼                                                          |
| `app/(app)/groups/[groupId]/{layout,page}.tsx`, `settings/`, `members/` | 수정 | 역할 주입, 그룹 홈 셸, 설정, 멤버 관리                                |
| `app/invite/[token]/page.tsx`                                           | 수정 | 초대 상태별 화면                                                      |

## 수락 기준

- [x] 더미 데이터로 랜딩 → 대시보드 → 그룹 생성 → 그룹 홈 → 설정/멤버 흐름을 클릭으로 끝까지 이동할 수 있다
- [x] 초대 수락 페이지가 유효·이미 멤버·만료·무효 상태를 각각 보여준다
- [x] member 역할 그룹에서는 관리자 탭이 숨겨지고 설정·멤버 페이지에 들어갈 수 없다
- [x] 360px 폭에서 가로 스크롤이 없고 콘솔 에러가 없다
- [x] `npm run check`, `npm run build` 통과

## 구현 단계

- [x] 공통 기반: 권한 규칙·날짜 포맷·목 액션·역할 연결
- [x] 랜딩·대시보드
- [x] 그룹 생성·설정(초대 링크)
- [x] 초대 수락 페이지
- [x] 멤버 관리·그룹 홈 셸
- [x] E2E 검증 및 로드맵 반영

## 테스트 체크리스트

> 더미 데이터 UI 작업이다. Playwright(테스트 계정 owner, 360×740) 스크립트로 흐름을 확인한다.

- [x] 단위 테스트: 멤버 권한 규칙(admin의 owner 변경 금지, 마지막 owner 강등·내보내기 금지, 자기 자신 내보내기 금지), KST 날짜 포맷
- [x] 랜딩 로그인 버튼 → 로그인 → 대시보드(카드 2개, owner·member 배지, 다음 이벤트 요약)
- [x] 새 그룹 만들기: 빈 이름 제출 시 "그룹명을 입력해 주세요." → 정상 제출 → 그룹 홈
- [x] 그룹 설정: 초대 링크 복사 토스트, 재발급 다이얼로그 → 새 링크
- [x] 멤버 관리: 역할 변경 토스트, 내보내기 다이얼로그, owner 행 내보내기 버튼 없음
- [x] 독서 모임(member): 관리자 탭 숨김, `/settings` 직접 접근 시 그룹 홈으로 이동
- [x] 초대 토큰 4개 상태 화면, 유효 토큰 가입하기 → 그룹 홈
- [x] 대시보드 `?preview=empty` 빈 상태, 없는 groupId → not-found
- [x] 전 화면 가로 스크롤 없음, 콘솔 에러 0건

## 변경 사항 요약

- 공통 기반: `lib/groups/member-permissions.ts`(권한 규칙 + 테스트), `lib/format/date.ts`(KST 포맷 + 테스트), 목 Server Action 6종(`lib/mocks/actions.ts`), 그룹 레이아웃에 그룹별 더미 역할 주입(`dummy-role.ts` 제거), `EmptyState`·`RoleBadge`, `useActionToast`, `ActionState<T>`.
- 랜딩·대시보드: 소개 카피·기능 카드·로그인 상태별 버튼, 그룹 카드 목록(역할 배지·멤버 수·다음 이벤트), `?preview=empty` 빈 상태.
- 그룹 생성·설정: `GroupForm`(useActionState + FormField 에러 연결), 초대 링크 카드(복사·재발급 확인 다이얼로그).
- 초대 수락: `app/invite/[token]`을 셸 밖 단독 화면으로 만들고 유효(미리보기 + `AcceptInviteForm`)·이미 멤버(그룹 홈 링크)·만료·무효(에러 카드 + 대시보드 링크) 상태를 나눴다.
- 멤버 관리: `components/groups/member-list.tsx`에서 역할 변경 Select(`getAssignableRoles`), 내보내기 AlertDialog(`canRemoveMember`), 결과 토스트와 로컬 목록 갱신. 비관리자는 그룹 홈으로 리다이렉트.
- 그룹 홈 셸: 그룹 정보 카드(설명·멤버 수·내 역할), 관리자 바로가기(설정·멤버), 공지·이벤트 자리 표시(Phase 2).
- 결정: 그룹 홈은 그룹이 없을 때만 404를 낸다. 더미 가입은 저장되지 않아 비멤버 404를 넣으면 초대 가입 직후 화면이 깨지기 때문이다. 비멤버 404는 Task 009에서 레이아웃 멤버십 조회로 처리한다.
- 검증(2026-10-03): `npm run check`(86개 테스트)·`npm run build` 통과. 캐시 Chromium 스크립트(owner 계정, 360×740)로 위 체크리스트 22개 항목 통과, 전 화면 scrollWidth 360, 콘솔 에러 0건.
