import { AppHeader } from "@/components/layout/app-header";
import { BottomTabNav } from "@/components/layout/bottom-tab-nav";
import {
  HeaderSkeleton,
  TabBarSkeleton,
} from "@/components/layout/nav-skeleton";
import { Suspense } from "react";

/**
 * 로그인 후 영역의 공통 앱 셸: 상단 헤더 + 본문 + 공통(대시보드/프로필) 하단 탭.
 * 그룹·이벤트 탭 바는 하위 레이아웃이 각자 렌더하고, 이 탭 바는 그 경로에서 스스로 숨는다.
 * 헤더·탭 바는 usePathname을 쓰므로 동적 경로 prerender를 위해 Suspense로 감싼다.
 * 비로그인 접근은 proxy가 로그인 페이지로 보낸다.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col">
      <Suspense fallback={<HeaderSkeleton />}>
        <AppHeader />
      </Suspense>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4">
        {children}
      </main>
      <Suspense fallback={<TabBarSkeleton />}>
        <BottomTabNav context="app" />
      </Suspense>
    </div>
  );
}
