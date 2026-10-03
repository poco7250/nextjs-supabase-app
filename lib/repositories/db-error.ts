import {
  ACTION_ERROR_CODES,
  type ActionErrorCode,
} from "@/lib/types/action-result";

/** Supabase(PostgREST) 에러에서 매핑에 쓰는 필드 */
type PostgrestLikeError = { code?: string; message?: string };

/** 표준 SQLSTATE → ActionErrorCode (docs/db-schema.md §6.4) */
const SQLSTATE_CODE: Record<string, ActionErrorCode> = {
  "23505": "CONFLICT", // 유니크 위반
  "23514": "VALIDATION", // CHECK 위반
  "42501": "FORBIDDEN", // 권한 없음(RLS·grant)
  "22P02": "NOT_FOUND", // 잘못된 uuid 등 형식 오류 → 대상 없음으로 취급
};

/** RPC가 'CODE: 메시지' 형식으로 던진 에러(errcode P0001) */
const RPC_MESSAGE_PATTERN = /^([A-Z_]+): ([\s\S]+)$/;

/**
 * DB 에러를 앱 에러 코드로 바꾼 예외. service가 잡아서 ActionResult 실패로 돌려준다.
 * message는 RPC가 보낸 한국어 문구거나, 표준 SQLSTATE면 비어 있다(service가 문구를 정한다).
 */
export class DbError extends Error {
  constructor(
    readonly code: ActionErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "DbError";
  }
}

/**
 * PostgREST 에러를 DbError로 바꾼다. 알 수 없는 에러는 INTERNAL이다.
 */
export function toDbError(error: PostgrestLikeError): DbError {
  if (error.code === "P0001" && error.message) {
    const match = RPC_MESSAGE_PATTERN.exec(error.message);
    const code = match?.[1] as ActionErrorCode | undefined;
    if (match && code && ACTION_ERROR_CODES.includes(code)) {
      return new DbError(code, match[2], error);
    }
  }
  const mapped = error.code ? SQLSTATE_CODE[error.code] : undefined;
  return new DbError(mapped ?? "INTERNAL", "", error);
}
