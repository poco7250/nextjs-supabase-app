# lib/repositories — 데이터 접근 계층

Supabase 쿼리와 RPC 호출은 이 계층에서만 한다. 위 계층(service)은 도메인 모델(`lib/types/domain.ts`)만 다룬다.

## 규칙

- **클라이언트 생성**: 서버에서는 `lib/supabase/server.ts`의 `createClient()`를 **함수 안에서 호출할 때마다** 새로 만든다. Fluid compute 때문에 전역 변수에 캐싱하면 안 된다. 브라우저 클라이언트(`lib/supabase/client.ts`)는 repository에서 쓰지 않는다.
- **타입**: 쿼리 결과는 `Database['public']['Tables'][...]['Row']`(`lib/supabase/database.types.ts`, 생성 파일이라 직접 수정 금지) 타입으로 받는다.
- **매핑**: snake_case Row를 camelCase 도메인 모델로 바꾸는 매퍼(`toGroup(row)` 등)를 같은 파일에 두고, 바깥으로는 도메인 모델만 내보낸다.
- **쓰기**: 동시성이 걸린 쓰기(RSVP, 대기자 승급, 카풀 좌석, 정산 재계산)는 테이블에 직접 insert/update하지 않고 RPC(`supabase.rpc(...)`)로만 한다. 나머지는 RLS 정책이 허용하는 범위에서만 쓴다.
- **에러**: Supabase `error`는 삼키지 않는다. `logger.error("<repository 이름>", ...)`로 남긴 뒤 throw하거나 `null`을 돌려준다. 이 파일 안에서 어느 방식으로 할지 통일한다. 한국어 사용자 문구는 service가 정한다.
- **캐싱**: 사용자별 데이터를 `"use cache"`로 캐싱하지 않는다. 쿠키·세션을 읽는 호출은 Suspense 경계 안의 컴포넌트나 Server Action에서만 한다.
- **파일 이름**: `<도메인>-repository.ts` (예: `group-repository.ts`).
- 함수는 30줄 이하로 유지하고, 한국어 JSDoc을 단다.

## 예시

```ts
/** 내가 속한 그룹 목록을 가입일 역순으로 가져온다 */
export async function listMyGroups(userId: string): Promise<Group[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("groups(*)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (error) {
    logger.error("group-repository", "그룹 목록 조회 실패", error);
    throw error;
  }
  return data.flatMap((row) => (row.groups ? [toGroup(row.groups)] : []));
}
```
