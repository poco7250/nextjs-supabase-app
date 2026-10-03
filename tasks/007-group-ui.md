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

| 파일                                                                    | 구분 | 설명                                                         |
| ----------------------------------------------------------------------- | ---- | ------------------------------------------------------------ |
| `lib/groups/member-permissions.ts`                                      | 생성 | 역할 변경·내보내기 권한 규칙 + 테스트                        |
| `lib/format/date.ts`                                                    | 생성 | KST 날짜·일시 표시 + 테스트                                  |
| `lib/mocks/actions.ts`                                                  | 생성 | 목 Server Action 6종                                         |
| `lib/mocks/dummy-role.ts`                                               | 삭제 | 그룹별 더미 역할로 대체                                      |
| `lib/constants/routes.ts`                                               | 수정 | `signUp` 경로 추가                                           |
| `components/empty-state.tsx`, `components/groups/*`                     | 생성 | 빈 상태, 역할 배지, 그룹 카드, 그룹 폼, 초대 링크, 멤버 목록 |
| `app/page.tsx`                                                          | 수정 | 랜딩 카피·기능 소개·로그인/회원가입 버튼                     |
| `app/(app)/dashboard/page.tsx`                                          | 수정 | 그룹 카드 목록, 빈 상태                                      |
| `app/(app)/groups/new/page.tsx`                                         | 수정 | 그룹 생성 폼                                                 |
| `app/(app)/groups/[groupId]/{layout,page}.tsx`, `settings/`, `members/` | 수정 | 역할 주입, 그룹 홈 셸, 설정, 멤버 관리                       |
| `app/invite/[token]/page.tsx`                                           | 수정 | 초대 상태별 화면                                             |

## 수락 기준

- [ ] 더미 데이터로 랜딩 → 대시보드 → 그룹 생성 → 그룹 홈 → 설정/멤버 흐름을 클릭으로 끝까지 이동할 수 있다
- [ ] 초대 수락 페이지가 유효·이미 멤버·만료·무효 상태를 각각 보여준다
- [ ] member 역할 그룹에서는 관리자 탭이 숨겨지고 설정·멤버 페이지에 들어갈 수 없다
- [ ] 360px 폭에서 가로 스크롤이 없고 콘솔 에러가 없다
- [ ] `npm run check`, `npm run build` 통과

## 구현 단계

- [ ] 공통 기반: 권한 규칙·날짜 포맷·목 액션·역할 연결
- [ ] 랜딩·대시보드
- [ ] 그룹 생성·설정(초대 링크)
- [ ] 초대 수락 페이지
- [ ] 멤버 관리·그룹 홈 셸
- [ ] E2E 검증 및 로드맵 반영

## 테스트 체크리스트

> 더미 데이터 UI 작업이다. Playwright(테스트 계정 owner, 360×740) 스크립트로 흐름을 확인한다.

- [ ] 단위 테스트: 멤버 권한 규칙(admin의 owner 변경 금지, 마지막 owner 강등·내보내기 금지, 자기 자신 내보내기 금지), KST 날짜 포맷
- [ ] 랜딩 로그인 버튼 → 로그인 → 대시보드(카드 2개, owner·member 배지, 다음 이벤트 요약)
- [ ] 새 그룹 만들기: 빈 이름 제출 시 "그룹명을 입력해 주세요." → 정상 제출 → 그룹 홈
- [ ] 그룹 설정: 초대 링크 복사 토스트, 재발급 다이얼로그 → 새 링크
- [ ] 멤버 관리: 역할 변경 토스트, 내보내기 다이얼로그, owner 행 내보내기 버튼 없음
- [ ] 독서 모임(member): 관리자 탭 숨김, `/settings` 직접 접근 시 그룹 홈으로 이동
- [ ] 초대 토큰 4개 상태 화면, 유효 토큰 가입하기 → 그룹 홈
- [ ] 대시보드 `?preview=empty` 빈 상태, 없는 groupId → not-found
- [ ] 전 화면 가로 스크롤 없음, 콘솔 에러 0건

## 변경 사항 요약

(완료 후 작성)
