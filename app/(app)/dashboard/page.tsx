/**
 * 대시보드(내 그룹 목록) 페이지. 그룹 목록은 Phase 1에서 채운다.
 * 공개 경로가 아니라서 비로그인 사용자는 proxy가 로그인 페이지로 보낸다.
 */
export default function DashboardPage() {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">내 그룹</h2>
    </section>
  );
}
