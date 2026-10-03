import { BottomTabNav } from "@/components/layout/bottom-tab-nav";
import { getMockRole } from "@/lib/mocks/groups";
import { MOCK_CURRENT_USER_ID } from "@/lib/mocks/ids";
import { Suspense } from "react";

/**
 * 그룹 컨텍스트 레이아웃. 그룹 하단 탭(그룹 홈/이벤트 만들기/멤버/설정)을 렌더한다.
 * params는 레이아웃 최상단에서 await하지 않는다(같은 세그먼트의 loading.tsx가 layout을 감싸지 않아 static shell이 깨진다).
 * 대신 Suspense 안의 GroupTabNav에서 읽는다.
 */
export default function GroupLayout({
  children,
  params,
}: LayoutProps<"/groups/[groupId]">) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <GroupTabNav params={params} />
      </Suspense>
    </>
  );
}

/**
 * 현재 사용자의 그룹 내 역할을 조회해 하단 탭에 넘긴다.
 * 지금은 더미 역할이다. Task 009에서 실제 멤버십 조회로 교체한다.
 */
async function GroupTabNav({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const role = getMockRole(groupId, MOCK_CURRENT_USER_ID);
  return <BottomTabNav context="group" role={role} />;
}
