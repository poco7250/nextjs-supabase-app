import type { z } from "zod";
import { fromZodError } from "@/lib/types/action-result";

/**
 * 검증에 실패해야 하는 입력을 넣고, 화면에 전달될 필드별 메시지(`fromZodError`의 fieldErrors)를 돌려준다.
 * 검증이 통과하면 테스트가 실패하도록 에러를 던진다.
 */
export function fieldErrorsOf(
  schema: z.ZodType,
  input: unknown,
): Record<string, string> {
  const result = schema.safeParse(input);
  if (result.success) throw new Error("검증에 실패해야 하는 입력이 통과했어요");
  const failed = fromZodError(result.error);
  return failed.ok ? {} : (failed.error.fieldErrors ?? {});
}
