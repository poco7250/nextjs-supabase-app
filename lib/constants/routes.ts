/**
 * 앱 전역에서 쓰는 정적 경로 모음.
 * 경로 문자열을 하드코딩하지 말고 여기서 가져다 쓴다.
 */
export const routes = {
  home: "/",
  dashboard: "/dashboard",
  login: "/auth/login",
} as const;

/**
 * 로그인·회원가입·비밀번호 변경 후 기본으로 이동할 경로.
 */
export const DEFAULT_AUTH_REDIRECT = routes.dashboard;
