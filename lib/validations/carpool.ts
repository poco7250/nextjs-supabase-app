import { z } from "zod";
import {
  dateTimeSchema,
  positiveIntSchema,
  requiredText,
  uuidSchema,
} from "./common";

/** DB CHECK와 맞춘 상한 */
export const DEPARTURE_POINT_MAX = 100;
export const SEAT_COUNT_MAX = 10;

const carpoolFields = {
  departurePoint: requiredText("출발지", DEPARTURE_POINT_MAX),
  departureTime: dateTimeSchema("출발 시간"),
  seatCount: positiveIntSchema("좌석 수", SEAT_COUNT_MAX),
};

/** 카풀 등록 (F012, 참석 확정자) */
export const createCarpoolInputSchema = z.object({
  eventId: uuidSchema,
  ...carpoolFields,
});
export type CreateCarpoolInput = z.infer<typeof createCarpoolInputSchema>;

/** 카풀 수정 (운전자 본인). 탑승자 수 미만으로 좌석을 줄이는지는 DB가 검증한다 */
export const updateCarpoolInputSchema = z.object({
  carpoolId: uuidSchema,
  ...carpoolFields,
});
export type UpdateCarpoolInput = z.infer<typeof updateCarpoolInputSchema>;

/** 카풀 삭제, 탑승 신청/취소 (F013) */
export const carpoolIdInputSchema = z.object({ carpoolId: uuidSchema });
export type CarpoolIdInput = z.infer<typeof carpoolIdInputSchema>;
