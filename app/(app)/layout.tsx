/**
 * 로그인 후 영역의 공통 레이아웃. 헤더·하단 탭은 Task 003에서 추가한다.
 * 비로그인 접근은 proxy가 로그인 페이지로 보낸다.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <div className="flex min-h-svh flex-col">{children}</div>;
}
