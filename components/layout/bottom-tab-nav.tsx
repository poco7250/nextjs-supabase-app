"use client";

import {
  detectNavContext,
  getTabs,
  isTabActive,
  type NavContext,
  type NavTab,
} from "@/lib/navigation/tabs";
import type { GroupRole } from "@/lib/types/domain";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

type BottomTabNavProps = {
  /** 이 탭 바가 담당하는 컨텍스트. 현재 URL의 컨텍스트와 다르면 렌더하지 않는다 */
  context: NavContext;
  /** 그룹 내 역할. 관리자 탭 노출 여부를 정한다 (Phase 1에서 실제 역할 주입) */
  role?: GroupRole;
};

/** 하단 탭이 읽는 URL 동적 파라미터 */
type NavRouteParams = { groupId?: string; eventId?: string };

/**
 * 모바일 하단 탭 바. 레이아웃마다 하나씩 두고, 가장 안쪽 컨텍스트의 탭 바만 보이게 한다.
 * usePathname/useParams가 동적 경로에서 suspend하므로 Suspense 안에 둬야 한다.
 */
export function BottomTabNav({ context, role }: BottomTabNavProps) {
  const pathname = usePathname();
  const { groupId, eventId } = useParams<NavRouteParams>();

  if (detectNavContext({ groupId, eventId }) !== context) return null;

  const tabs = getTabs(context, { groupId, eventId, role });

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <ul
        className="mx-auto grid max-w-5xl"
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
        }}
      >
        {tabs.map((tab) => (
          <li key={tab.href} className="min-w-0">
            <TabItem tab={tab} active={isTabActive(pathname, tab)} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * 탭 하나. 터치 영역은 최소 56px 높이, 활성 탭은 aria-current="page".
 */
function TabItem({ tab, active }: { tab: NavTab; active: boolean }) {
  const Icon = tab.icon;

  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 px-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        active && "font-semibold text-primary",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className="w-full truncate text-center text-xs">{tab.label}</span>
    </Link>
  );
}
