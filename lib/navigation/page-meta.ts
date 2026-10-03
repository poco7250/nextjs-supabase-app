import { routes } from "@/lib/constants/routes";
import { siteConfig } from "@/lib/constants/site";

/** 경로 조각 하나 (슬래시 제외) */
const ID = "([^/]+)";

type PageMeta = {
  pattern: RegExp;
  title: string;
  /** 헤더 뒤로 가기 목적지. 매칭된 동적 조각을 받는다. null이면 버튼을 숨긴다 */
  parent: (ids: string[]) => string | null;
};

/**
 * 앱 셸이 다루는 페이지 표. 위에서부터 첫 매칭을 쓰므로 구체적인 패턴을 먼저 둔다.
 * groups/new와 events/new는 동적 패턴보다 앞에 둬야 한다.
 */
const PAGE_META: PageMeta[] = [
  { pattern: /^\/dashboard$/, title: "내 그룹", parent: () => null },
  { pattern: /^\/profile$/, title: "내 프로필", parent: () => null },
  {
    pattern: /^\/groups\/new$/,
    title: "그룹 만들기",
    parent: () => routes.dashboard,
  },
  {
    pattern: new RegExp(`^/groups/${ID}/events/new$`),
    title: "이벤트 만들기",
    parent: ([g]) => routes.group(g),
  },
  {
    pattern: new RegExp(`^/groups/${ID}/events/${ID}/carpool$`),
    title: "카풀",
    parent: ([g, e]) => routes.event(g, e),
  },
  {
    pattern: new RegExp(`^/groups/${ID}/events/${ID}/settlement$`),
    title: "정산",
    parent: ([g, e]) => routes.event(g, e),
  },
  {
    pattern: new RegExp(`^/groups/${ID}/events/${ID}$`),
    title: "이벤트 상세",
    parent: ([g]) => routes.group(g),
  },
  {
    pattern: new RegExp(`^/groups/${ID}/settings$`),
    title: "그룹 설정",
    parent: ([g]) => routes.group(g),
  },
  {
    pattern: new RegExp(`^/groups/${ID}/members$`),
    title: "멤버 관리",
    parent: ([g]) => routes.group(g),
  },
  {
    pattern: new RegExp(`^/groups/${ID}$`),
    title: "그룹 홈",
    parent: () => routes.dashboard,
  },
];

/**
 * 경로에 맞는 페이지 정보와 동적 조각을 찾는다. 동적 조각은 디코딩해서 돌려준다
 * (routes 빌더가 다시 인코딩하므로 이중 인코딩을 막는다).
 */
function matchPage(pathname: string) {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  for (const meta of PAGE_META) {
    const match = meta.pattern.exec(path);
    if (match) return { meta, ids: match.slice(1).map(decodeURIComponent) };
  }
  return null;
}

/**
 * 헤더에 표시할 페이지 제목. 표에 없는 경로는 서비스명을 쓴다.
 */
export function getPageTitle(pathname: string): string {
  return matchPage(pathname)?.meta.title ?? siteConfig.name;
}

/**
 * 헤더 뒤로 가기 목적지. 최상위 화면(대시보드·프로필)이나 표에 없는 경로는 null.
 */
export function getParentHref(pathname: string): string | null {
  const found = matchPage(pathname);
  return found ? found.meta.parent(found.ids) : null;
}
