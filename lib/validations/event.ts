import { EVENT_STATUSES } from "@/lib/types/domain";
import { z } from "zod";
import {
  dateTimeSchema,
  optionalDateTimeSchema,
  optionalPositiveIntSchema,
  optionalText,
  optionalUuidSchema,
  requiredText,
  uuidSchema,
} from "./common";

/** DB CHECK와 맞춘 상한 */
export const EVENT_TITLE_MAX = 100;
export const EVENT_LOCATION_MAX = 200;
export const EVENT_DESCRIPTION_MAX = 2000;
export const EVENT_CAPACITY_MAX = 1000;

const eventFields = {
  title: requiredText("이벤트명", EVENT_TITLE_MAX),
  description: optionalText("설명", EVENT_DESCRIPTION_MAX),
  location: optionalText("장소", EVENT_LOCATION_MAX),
  startAt: dateTimeSchema("일시"),
  rsvpDeadline: optionalDateTimeSchema("응답 마감"),
  /** 비우면 null(제한 없음) */
  capacity: optionalPositiveIntSchema("정원", EVENT_CAPACITY_MAX),
};

type DeadlineFields = { startAt: string; rsvpDeadline: string | null };

/**
 * 응답 마감이 일시보다 늦지 않은지 확인한다. 마감이 없으면 통과.
 */
function isDeadlineBeforeStart({ startAt, rsvpDeadline }: DeadlineFields) {
  return (
    rsvpDeadline === null || Date.parse(rsvpDeadline) <= Date.parse(startAt)
  );
}

const deadlineRule = {
  error: "응답 마감은 이벤트 일시보다 늦을 수 없어요.",
  path: ["rsvpDeadline"],
};

/** 이벤트 생성 (F006). 복제로 만들면 clonedFromEventId에 원본 id */
export const createEventInputSchema = z
  .object({
    groupId: uuidSchema,
    clonedFromEventId: optionalUuidSchema,
    ...eventFields,
  })
  .refine(isDeadlineBeforeStart, deadlineRule);
export type CreateEventInput = z.infer<typeof createEventInputSchema>;

/** 이벤트 수정 (admin 이상) */
export const updateEventInputSchema = z
  .object({ eventId: uuidSchema, ...eventFields })
  .refine(isDeadlineBeforeStart, deadlineRule);
export type UpdateEventInput = z.infer<typeof updateEventInputSchema>;

/** 이벤트 상태 수동 변경 (F007, admin 이상) */
export const updateEventStatusInputSchema = z.object({
  eventId: uuidSchema,
  status: z.enum(EVENT_STATUSES, { error: "상태를 선택해 주세요." }),
});
export type UpdateEventStatusInput = z.infer<
  typeof updateEventStatusInputSchema
>;
