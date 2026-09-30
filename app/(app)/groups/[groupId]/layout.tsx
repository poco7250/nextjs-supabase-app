/**
 * 그룹 컨텍스트 레이아웃. 지금은 children만 렌더한다.
 * params는 여기서 await하지 않는다(같은 세그먼트의 loading.tsx가 layout을 감싸지 않아 static shell이 깨진다).
 * 멤버 여부 확인과 역할 조회는 Task 009에서 Suspense 안의 async 컴포넌트로 넣는다.
 */
export default function GroupLayout({
  children,
}: LayoutProps<"/groups/[groupId]">) {
  return children;
}
