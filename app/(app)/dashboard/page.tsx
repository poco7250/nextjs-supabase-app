/**
 * 대시보드(내 그룹 목록) 페이지. 그룹 목록은 Phase 1에서 채운다.
 * 공개 경로가 아니라서 비로그인 사용자는 proxy가 로그인 페이지로 보낸다.
 */
export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-5">
      <h1 className="text-2xl font-bold">내 그룹</h1>
    </main>
  );
}
