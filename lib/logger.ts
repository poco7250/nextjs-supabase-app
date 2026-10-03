/**
 * 의존성 없는 경량 로거. 서버·클라이언트·proxy 어디서나 동작하도록 Node 전용 API를 쓰지 않는다.
 * ESLint no-console 규칙(warn/error만 허용)에 맞춰 출력은 console.warn/console.error만 쓴다.
 * 나중에 pino·Sentry 등으로 바꿀 때는 이 파일의 write()만 교체하면 된다.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** 운영에서는 warn 이상만 남기고, 개발에서는 전부 남긴다 */
const MIN_LEVEL: LogLevel =
  process.env.NODE_ENV === "production" ? "warn" : "debug";

/**
 * 레벨을 확인하고 "[scope] message" 형식으로 출력한다. meta가 있으면 함께 넘긴다.
 */
function write(
  level: LogLevel,
  scope: string,
  message: string,
  meta?: unknown,
) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;

  const output = level === "error" ? console.error : console.warn;
  const line = `[${level}] [${scope}] ${message}`;

  if (meta === undefined) output(line);
  else output(line, meta);
}

/**
 * 앱 공용 로거. scope에는 모듈·기능 이름(예: "use-logout", "group-service")을 넣는다.
 */
export const logger = {
  debug: (scope: string, message: string, meta?: unknown) =>
    write("debug", scope, message, meta),
  info: (scope: string, message: string, meta?: unknown) =>
    write("info", scope, message, meta),
  warn: (scope: string, message: string, meta?: unknown) =>
    write("warn", scope, message, meta),
  error: (scope: string, message: string, meta?: unknown) =>
    write("error", scope, message, meta),
};
