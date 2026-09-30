/**
 * 초대 수락 페이지(공개 예정). 공개 경로 등록은 Task 010에서 한다.
 * params는 Promise라서 await한다. 같은 세그먼트의 loading.tsx가 Suspense 경계가 된다.
 */
export default async function InvitePage(props: PageProps<"/invite/[token]">) {
  const { token } = await props.params;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-5">
      <h1 className="text-2xl font-bold">초대 수락</h1>
      <p className="text-sm text-muted-foreground">{token}</p>
    </main>
  );
}
