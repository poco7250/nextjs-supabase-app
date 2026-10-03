import type { RsvpStatus } from "@/lib/types/domain";
import { z } from "zod";
import { uuidSchema } from "./common";

/**
 * 사용자가 직접 고를 수 있는 RSVP 상태. waitlisted는 정원 초과 시 서버(RPC)가 정한다.
 */
export const USER_RSVP_STATUSES = [
  "going",
  "not_going",
  "maybe",
] as const satisfies readonly RsvpStatus[];

/** RSVP 응답 (F009, F010) */
export const respondRsvpInputSchema = z.object({
  eventId: uuidSchema,
  status: z.enum(USER_RSVP_STATUSES, {
    error: "참석, 불참, 미정 중에서 골라 주세요.",
  }),
});
export type RespondRsvpInput = z.infer<typeof respondRsvpInputSchema>;

/** 출석 체크 설정/해제 (F011, admin 이상) */
export const setCheckInInputSchema = z.object({
  eventId: uuidSchema,
  userId: uuidSchema,
  checked: z.boolean(),
});
export type SetCheckInInput = z.infer<typeof setCheckInInputSchema>;
