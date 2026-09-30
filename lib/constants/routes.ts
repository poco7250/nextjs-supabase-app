/**
 * 동적 경로 조각을 URL에 안전하게 넣을 수 있도록 인코딩한다.
 */
const segment = (value: string) => encodeURIComponent(value);

/**
 * 앱 전역에서 쓰는 경로 모음. 정적 경로는 문자열, 동적 경로는 빌더 함수다.
 * 경로 문자열을 하드코딩하지 말고 여기서 가져다 쓴다.
 */
export const routes = {
  home: "/",
  dashboard: "/dashboard",
  login: "/auth/login",
  profile: "/profile",
  newGroup: "/groups/new",

  /** 초대 수락 페이지 (공개) */
  invite: (token: string) => `/invite/${segment(token)}`,

  /** 그룹 홈 */
  group: (groupId: string) => `/groups/${segment(groupId)}`,

  /** 그룹 설정 (owner/admin) */
  groupSettings: (groupId: string) => `${routes.group(groupId)}/settings`,

  /** 멤버 관리 (owner/admin) */
  groupMembers: (groupId: string) => `${routes.group(groupId)}/members`,

  /** 이벤트 생성 (owner/admin) */
  newEvent: (groupId: string) => `${routes.group(groupId)}/events/new`,

  /** 이벤트 상세 */
  event: (groupId: string, eventId: string) =>
    `${routes.group(groupId)}/events/${segment(eventId)}`,

  /** 이벤트 카풀 */
  eventCarpool: (groupId: string, eventId: string) =>
    `${routes.event(groupId, eventId)}/carpool`,

  /** 이벤트 정산 */
  eventSettlement: (groupId: string, eventId: string) =>
    `${routes.event(groupId, eventId)}/settlement`,
} as const;

/**
 * 로그인·회원가입·비밀번호 변경 후 기본으로 이동할 경로.
 */
export const DEFAULT_AUTH_REDIRECT = routes.dashboard;
