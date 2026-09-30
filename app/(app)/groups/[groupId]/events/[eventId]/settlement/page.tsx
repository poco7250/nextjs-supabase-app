/**
 * 이벤트 정산 페이지. Phase 4에서 채운다.
 * params는 Promise라서 await한다. 같은 세그먼트의 loading.tsx가 Suspense 경계가 된다.
 */
export default async function EventSettlementPage(
  props: PageProps<"/groups/[groupId]/events/[eventId]/settlement">,
) {
  const { groupId, eventId } = await props.params;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-5">
      <h1 className="text-2xl font-bold">정산</h1>
      <p className="text-sm text-muted-foreground">
        {groupId} / {eventId}
      </p>
    </main>
  );
}
