import { z } from "zod";
import { requiredText } from "./common";

/** DB CHECK와 맞춘 상한 */
export const FULL_NAME_MAX = 30;

/** 표시 이름 수정 (F021). profiles.full_name에 저장 */
export const updateProfileInputSchema = z.object({
  fullName: requiredText("표시 이름", FULL_NAME_MAX),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
