import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fail, fromZodError, ok } from "@/lib/types/action-result";

describe("ok / fail", () => {
  it("성공 응답은 data만 담는다", () => {
    expect(ok({ id: 1 })).toEqual({ ok: true, data: { id: 1 } });
  });

  it("실패 응답은 code와 message를 담는다", () => {
    expect(fail("FORBIDDEN", "권한이 없어요.")).toEqual({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "권한이 없어요.",
        fieldErrors: undefined,
      },
    });
  });
});

describe("fromZodError", () => {
  const schema = z
    .object({
      name: z
        .string()
        .min(2, { error: "이름은 2자 이상" })
        .regex(/^[가-힣]+$/, {
          error: "이름은 한글만",
        }),
      tags: z.array(z.string({ error: "태그는 문자열" })),
    })
    .refine(() => false, { error: "전체 규칙 위반" });

  it("VALIDATION 코드와 첫 이슈 메시지를 대표 메시지로 쓴다", () => {
    const result = schema.safeParse({ name: "a", tags: ["ok", 1] });
    if (result.success) throw new Error("실패해야 해요");
    const failed = fromZodError(result.error);

    expect(failed.ok).toBe(false);
    if (failed.ok) return;
    expect(failed.error.code).toBe("VALIDATION");
    expect(failed.error.message).toBe("이름은 2자 이상");
  });

  it("필드 경로별로 첫 메시지만 남기고, 중첩 경로는 점으로 잇는다", () => {
    const result = schema.safeParse({ name: "a", tags: ["ok", 1] });
    if (result.success) throw new Error("실패해야 해요");
    const failed = fromZodError(result.error);

    expect(failed.ok ? null : failed.error.fieldErrors).toEqual({
      name: "이름은 2자 이상",
      "tags.1": "태그는 문자열",
    });
  });

  it("경로가 없는 이슈는 fieldErrors에 넣지 않는다", () => {
    const result = schema.safeParse({ name: "가나", tags: [] });
    if (result.success) throw new Error("실패해야 해요");
    const failed = fromZodError(result.error);

    expect(failed.ok ? null : failed.error).toEqual({
      code: "VALIDATION",
      message: "전체 규칙 위반",
      fieldErrors: {},
    });
  });
});
