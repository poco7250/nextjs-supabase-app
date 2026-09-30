/**
 * 이벤트 생성 페이지(owner/admin).
 * params는 Promise라서 await한다. 같은 세그먼트의 loading.tsx가 Suspense 경계가 된다.
 */
export default async function NewEventPage(
  props: PageProps<"/groups/[groupId]/events/new">,
) {
  const { groupId } = await props.params;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-5">
      <h1 className="text-2xl font-bold">이벤트 만들기</h1>
      <p className="text-sm text-muted-foreground">{groupId}</p>
    </main>
  );
}
