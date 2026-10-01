import { routes } from "@/lib/constants/routes";
import {
  Car,
  CalendarDays,
  CalendarPlus,
  House,
  LayoutGrid,
  ReceiptText,
  Settings,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * 그룹 내 역할. Task 004에서 lib/types/domain.ts로 옮긴다.
 */
export type GroupRole = "owner" | "admin" | "member";

/** 하단 탭 바가 보여줄 메뉴 묶음 */
export type NavContext = "app" | "group" | "event";

export type NavTab = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** owner/admin에게만 노출 */
  adminOnly?: boolean;
  /** true면 href와 정확히 같을 때만 활성 (하위 경로에서 비활성) */
  exact?: boolean;
};

type NavParams = {
  groupId?: string;
  eventId?: string;
};

/**
 * URL 동적 파라미터로 현재 내비게이션 컨텍스트를 판정한다.
 */
export function detectNavContext({ groupId, eventId }: NavParams): NavContext {
  if (groupId && eventId) return "event";
  if (groupId) return "group";
  return "app";
}

/**
 * 관리자 탭을 볼 수 있는 역할인지 판정한다.
 */
export function isAdminRole(role?: GroupRole): boolean {
  return role === "owner" || role === "admin";
}

/**
 * 공통 탭: 대시보드 / 내 프로필
 */
function appTabs(): NavTab[] {
  return [
    { href: routes.dashboard, label: "내 그룹", icon: LayoutGrid },
    { href: routes.profile, label: "내 프로필", icon: User },
  ];
}

/**
 * 그룹 내부 탭: 그룹 홈 / 이벤트 만들기* / 멤버* / 설정* (*는 owner·admin 전용)
 */
function groupTabs(groupId: string): NavTab[] {
  return [
    { href: routes.group(groupId), label: "그룹 홈", icon: House, exact: true },
    {
      href: routes.newEvent(groupId),
      label: "이벤트 만들기",
      icon: CalendarPlus,
      adminOnly: true,
    },
    {
      href: routes.groupMembers(groupId),
      label: "멤버",
      icon: Users,
      adminOnly: true,
    },
    {
      href: routes.groupSettings(groupId),
      label: "설정",
      icon: Settings,
      adminOnly: true,
    },
  ];
}

/**
 * 이벤트 내부 탭: 상세 / 카풀 / 정산
 */
function eventTabs(groupId: string, eventId: string): NavTab[] {
  return [
    {
      href: routes.event(groupId, eventId),
      label: "상세",
      icon: CalendarDays,
      exact: true,
    },
    { href: routes.eventCarpool(groupId, eventId), label: "카풀", icon: Car },
    {
      href: routes.eventSettlement(groupId, eventId),
      label: "정산",
      icon: ReceiptText,
    },
  ];
}

/**
 * 컨텍스트와 역할에 맞는 탭 목록을 만든다. 관리자 전용 탭은 owner/admin일 때만 포함한다.
 * 필요한 파라미터가 없으면 공통 탭으로 대체한다.
 */
export function getTabs(
  context: NavContext,
  { groupId, eventId, role }: NavParams & { role?: GroupRole },
): NavTab[] {
  let tabs: NavTab[];
  if (context === "event" && groupId && eventId) {
    tabs = eventTabs(groupId, eventId);
  } else if (context === "group" && groupId) {
    tabs = groupTabs(groupId);
  } else {
    tabs = appTabs();
  }
  return tabs.filter((tab) => !tab.adminOnly || isAdminRole(role));
}

/**
 * 현재 경로에서 탭이 활성 상태인지 판정한다.
 */
export function isTabActive(pathname: string, tab: NavTab): boolean {
  if (pathname === tab.href) return true;
  return !tab.exact && pathname.startsWith(`${tab.href}/`);
}
