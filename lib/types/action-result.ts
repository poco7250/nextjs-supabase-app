import type { ZodError } from "zod";

/**
 * Server Action·service가 돌려주는 에러 코드 목록. 화면은 code로 분기하고 message를 그대로 보여준다.
 */
export const ACTION_ERROR_CODES = [
  "VALIDATION", // 입력 검증 실패
  "UNAUTHENTICATED", // 로그인 필요 (세션 없음·만료)
  "FORBIDDEN", // 권한 없음 (비멤버, 비관리자, 비참석자)
  "NOT_FOUND", // 대상 없음
  "CONFLICT", // 중복·상태 충돌 (이미 멤버, 이미 신청 등)
  "CAPACITY_FULL", // 정원·좌석 초과
  "LOCKED", // 입금 확인 후 정산 항목 수정 등 잠긴 상태
  "INVALID_INVITE", // 초대 토큰 무효·만료
  "INTERNAL", // 예상하지 못한 서버 오류
] as const;

export type ActionErrorCode = (typeof ACTION_ERROR_CODES)[number];

export type ActionError = {
  code: ActionErrorCode;
  /** 사용자에게 보여줄 한국어 문구 */
  message: string;
  /** VALIDATION일 때 필드 경로("capacity", "sharerIds.0" 등)별 첫 메시지 */
  fieldErrors?: Record<string, string>;
};

/**
 * 일관된 Server Action 응답 형식. 성공이면 data, 실패면 error만 담는다.
 */
export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: ActionError };

/**
 * 성공 응답을 만든다.
 */
export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

/**
 * 실패 응답을 만든다.
 */
export function fail<T = never>(
  code: ActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
): ActionResult<T> {
  return { ok: false, error: { code, message, fieldErrors } };
}

/**
 * Zod 검증 에러를 VALIDATION 실패 응답으로 바꾼다.
 * 대표 메시지는 첫 이슈, fieldErrors는 경로별 첫 메시지만 남긴다(FormField의 error prop에 바로 연결).
 */
export function fromZodError<T = never>(error: ZodError): ActionResult<T> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.map(String).join(".");
    if (path && !(path in fieldErrors)) fieldErrors[path] = issue.message;
  }

  const message = error.issues[0]?.message ?? "입력값을 확인해 주세요.";
  return fail("VALIDATION", message, fieldErrors);
}
