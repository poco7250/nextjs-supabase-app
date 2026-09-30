/**
 * 그룹 설정 페이지(owner/admin).
 * params는 Promise라서 await한다. 같은 세그먼트의 loading.tsx가 Suspense 경계가 된다.
 */
export default async function GroupSettingsPage(
  props: PageProps<"/groups/[groupId]/settings">,
) {
  const { groupId } = await props.params;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-5">
      <h1 className="text-2xl font-bold">그룹 설정</h1>
      <p className="text-sm text-muted-foreground">{groupId}</p>
    </main>
  );
}
