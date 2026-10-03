# 009. 그룹 생성/수정 및 대시보드 연동

- ROADMAP: Task 009
- 규모: M | 기능 ID: F001, F022 | 의존: Task 007, 008

## 명세

Task 007의 더미 화면을 Task 008의 스키마·RPC에 연결한다. 대상은 그룹 생성, 그룹 정보 수정, 그룹 레이아웃(멤버십·역할), 그룹 홈, 대시보드다. 레이어는 Server Action(컨트롤러) → `group-service` → `group-repository` 순서다.

결정 사항:

- **DB 에러 매핑**은 `lib/repositories/db-error.ts`가 맡는다. RPC의 `'CODE: 메시지'`(P0001)와 표준 SQLSTATE(`23505`·`23514`·`42501`·`22P02`)를 `ActionErrorCode`로 바꾼 `DbError`를 throw한다. service의 `run()`이 이를 `ActionResult` 실패로 바꾼다. 예상하지 못한 오류만 error 로그를 남긴다.
- service의 `run()`은 catch 첫 줄에서 `unstable_rethrow`를 부른다. 이게 없으면 프리렌더 중단 신호(`cookies()`)나 `notFound`·`redirect`를 삼켜 빌드 로그에 가짜 에러가 찍힌다.
- **페이지 결과 처리**는 `lib/navigation/page-result.ts`의 `unwrapPageResult`를 쓴다. NOT_FOUND는 `notFound()`, UNAUTHENTICATED는 로그인 화면, 그 밖은 세그먼트 error 경계다. FORBIDDEN은 화면마다 처리가 달라서 직접 다룬다(설정 → 그룹 홈 리다이렉트).
- **비멤버 404**는 레이아웃(`GroupTabNav`)과 각 페이지의 service 조회 양쪽에서 걸린다. RLS 때문에 비멤버에게는 행이 보이지 않는다. 형식이 틀린 groupId도 service에서 NOT_FOUND로 처리한다.
- **화면 갱신**: 생성하면 `revalidatePath(dashboard)` 후 그룹 홈으로 `redirect`한다. 수정하면 `revalidatePath(group, "layout")`와 대시보드를 갱신한다. 사용자별 데이터라 `"use cache"`는 쓰지 않는다.
- **초대 재발급 연동을 앞당김**: 설정 화면을 실데이터로 바꾸면 목 재발급 액션이 실제 그룹에서 항상 FORBIDDEN을 낸다. 그래서 활성 초대 조회와 `regenerate_invite` 연동을 이 Task에서 했다. 초대 수락 화면과 `next` 처리는 그대로 Task 010이다.
- 대시보드의 `?preview=empty` 미리보기는 지웠다. 다음 이벤트 요약은 Task 015 전까지 "예정 이벤트 없음"이다.
- 멤버 관리 화면(Task 011)과 초대 수락 화면(Task 010)은 아직 목 데이터라서, 실제 그룹 id로 들어가면 404다.

## 관련 파일

| 파일                                                            | 구분 | 설명                                                             |
| --------------------------------------------------------------- | ---- | ---------------------------------------------------------------- |
| `lib/repositories/db-error.ts`                                  | 생성 | DB 에러 → `DbError`(ActionErrorCode) + 테스트                    |
| `lib/repositories/auth-repository.ts`                           | 생성 | `getCurrentUserId()` (getClaims)                                 |
| `lib/repositories/group-repository.ts`                          | 생성 | 그룹 CRUD·멤버 역할·멤버 수·내 그룹 목록·초대 조회/재발급        |
| `lib/services/group-service.ts`                                 | 생성 | 권한 판정, 에러 문구, `ActionResult` 변환                        |
| `app/(app)/groups/actions.ts`                                   | 생성 | `createGroupAction`·`updateGroupAction`·`regenerateInviteAction` |
| `lib/navigation/page-result.ts`                                 | 생성 | `unwrapPageResult`                                               |
| `app/(app)/groups/[groupId]/layout.tsx`                         | 수정 | 실제 역할 조회, 비멤버 404                                       |
| `app/(app)/groups/[groupId]/page.tsx`, `settings/page.tsx`      | 수정 | 실데이터 연동                                                    |
| `app/(app)/groups/new/page.tsx`, `app/(app)/dashboard/page.tsx` | 수정 | 실제 액션·목록                                                   |
| `lib/mocks/actions.ts`                                          | 수정 | 교체된 목 액션 3개 삭제                                          |

## 수락 기준

- [x] 그룹 생성 → `create_group` RPC → 그룹 홈으로 리다이렉트
- [x] 그룹 설정에서 그룹명/설명 수정(admin 이상), 비관리자가 URL로 접근하면 그룹 홈으로 리다이렉트
- [x] `groups/[groupId]/layout.tsx`에서 비멤버는 `notFound()`, 역할을 하단 탭에 주입
- [x] 대시보드 그룹 목록 실데이터, 다음 이벤트는 "예정 이벤트 없음"
- [x] `npm run check`, `npm run build` 통과

## 구현 단계

- [x] repository·service·Server Action
- [x] 화면 연동(레이아웃, 그룹 홈, 생성, 설정, 대시보드)
- [x] E2E 검증 및 문서 반영

## 테스트 체크리스트

> 캐시 Chromium 스크립트(360×740)로 검증했다. 계정은 owner·member·admin(비멤버 역할) 3개를 썼다. member 가입은 초대 화면(Task 010) 대신 같은 `accept_invite` RPC를 supabase-js로 호출했다.

- [x] 그룹 생성 후 대시보드에 owner 배지와 함께 표시("멤버 1명", "예정 이벤트 없음")
- [x] 빈 그룹명 → "그룹명을 입력해 주세요.", 51자 → "그룹명은 50자 이하로 입력해 주세요."
- [x] 그룹 정보 수정 토스트, 그룹 홈에 반영
- [x] 초대 링크 표시(무기한), 재발급 → 새 링크, 이전 토큰으로 가입 시 INVALID_INVITE
- [x] member 계정: 관리자 탭·바로가기 숨김, `/groups/[id]/settings` 직접 접근 시 그룹 홈으로 이동
- [x] 비멤버 계정: 그룹 URL·설정 URL 404, 잘못된 groupId 404, 대시보드에 그룹 없음
- [x] 설정 화면 가로 스크롤 없음, 콘솔 에러 0건

## 변경 사항 요약

- 검증(2026-10-03): `npm run check`(테스트 90개, `db-error` 4개 추가)와 `npm run build`가 경고 로그 없이 통과했다. E2E 18개 항목도 모두 통과했다.
- 시드 상태: owner 계정의 "E2E 테스트 그룹"이 생겼고 member 계정이 member로 가입했다. admin 계정은 아직 비멤버다(Task 010에서 초대 수락으로 가입).
- E2E 팁: Next 16은 이전에 방문한 화면을 숨긴 채 DOM에 남긴다. `button[type="submit"]`처럼 여러 화면에 있는 셀렉터는 `:visible`로 한정해야 한다.
