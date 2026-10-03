import { BottomTabNav } from "@/components/layout/bottom-tab-nav";
import { Suspense } from "react";

/**
 * 이벤트 컨텍스트 레이아웃. 이벤트 하단 탭(상세/카풀/정산)을 렌더한다.
 * params는 여기서 await하지 않는다. 이벤트 접근 확인은 Phase 2에서 Suspense 안에 넣는다.
 */
export default function EventLayout({
  children,
}: LayoutProps<"/groups/[groupId]/events/[eventId]">) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <BottomTabNav context="event" />
      </Suspense>
    </>
  );
}
