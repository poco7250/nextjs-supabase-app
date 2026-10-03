# lib/services — 비즈니스 규칙 계층

요청 흐름은 **Server Action / Route Handler(컨트롤러) → service → repository** 순서다. service는 그 가운데 계층이다.

## 규칙

- **입력**: 컨트롤러가 `lib/validations/*`의 Zod 스키마로 검증한 DTO(`XxxInput`)만 받는다. `FormData`나 검증 전 값은 받지 않는다.
- **출력**: 항상 `ActionResult<T>`(`lib/types/action-result.ts`)를 돌려준다. 예상한 실패(권한 없음, 정원 초과 등)는 `fail(code, message)`로 반환하고 throw하지 않는다.
- **하는 일**: 권한 판정, 상태 전이 규칙, 여러 repository 호출 조합, 사용자에게 보여줄 한국어 에러 문구 결정.
- **하지 않는 일**: Supabase 클라이언트 직접 사용, SQL·RPC 호출. 이런 일은 repository에 맡긴다.
- **동시성**: RSVP·대기자 승급·카풀 좌석·정산 재계산은 DB RPC가 잠금과 검증을 맡는다. service는 RPC 결과를 해석해서 `ActionResult`로 바꾸기만 한다.
- **로깅**: 예상하지 못한 오류는 `logger.error("<service 이름>", 메시지, 원인)`으로 남기고 `fail("INTERNAL", ...)`을 반환한다. `console.*`은 직접 쓰지 않는다.
- **파일 이름**: `<도메인>-service.ts` (예: `group-service.ts`). 함수 이름은 동사로 시작하는 camelCase로 쓴다 (예: `createGroup`).
- 함수는 30줄 이하로 유지하고, 한국어 JSDoc을 단다.

## 예시

```ts
/** 그룹을 만들고 생성된 그룹 id를 돌려준다 */
export async function createGroup(
  input: CreateGroupInput,
): Promise<ActionResult<{ groupId: string }>> {
  const result = await groupRepository.createGroup(input);
  if (!result) return fail("INTERNAL", "그룹을 만들지 못했어요.");
  return ok({ groupId: result.id });
}
```
