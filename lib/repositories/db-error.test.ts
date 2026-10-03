import { describe, expect, it } from "vitest";
import { DbError, toDbError } from "./db-error";

describe("toDbError", () => {
  it("RPC의 'CODE: 메시지' 에러를 코드와 한국어 문구로 나눈다", () => {
    const error = toDbError({
      code: "P0001",
      message: "CONFLICT: 마지막 소유자는 내보낼 수 없어요.",
    });
    expect(error).toBeInstanceOf(DbError);
    expect(error.code).toBe("CONFLICT");
    expect(error.message).toBe("마지막 소유자는 내보낼 수 없어요.");
  });

  it("알 수 없는 코드가 붙은 P0001은 INTERNAL로 본다", () => {
    expect(toDbError({ code: "P0001", message: "WHATEVER: 뭔가" }).code).toBe(
      "INTERNAL",
    );
  });

  it("표준 SQLSTATE를 앱 에러 코드로 바꾼다", () => {
    expect(toDbError({ code: "23505" }).code).toBe("CONFLICT");
    expect(toDbError({ code: "23514" }).code).toBe("VALIDATION");
    expect(toDbError({ code: "42501" }).code).toBe("FORBIDDEN");
    expect(toDbError({ code: "22P02" }).code).toBe("NOT_FOUND");
  });

  it("코드가 없거나 모르는 SQLSTATE는 INTERNAL이고 문구는 비워 둔다", () => {
    const error = toDbError({ message: "network" });
    expect(error.code).toBe("INTERNAL");
    expect(error.message).toBe("");
    expect(toDbError({ code: "08006" }).code).toBe("INTERNAL");
  });
});
