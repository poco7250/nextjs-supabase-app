import { BottomTabNav } from "@/components/layout/bottom-tab-nav";
import { DUMMY_GROUP_ROLE } from "@/lib/mocks/dummy-role";
import { Suspense } from "react";

/**
 * 그룹 컨텍스트 레이아웃. 그룹 하단 탭(그룹 홈/이벤트 만들기/멤버/설정)을 렌더한다.
 * params는 여기서 await하지 않는다(같은 세그먼트의 loading.tsx가 layout을 감싸지 않아 static shell이 깨진다).
 * 역할은 지금 더미 값이다. Task 009에서 멤버 확인과 실제 역할 조회를 Suspense 안의 async 컴포넌트로 교체한다.
 */
export default function GroupLayout({
  children,
}: LayoutProps<"/groups/[groupId]">) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <BottomTabNav context="group" role={DUMMY_GROUP_ROLE} />
      </Suspense>
    </>
  );
}
