import { z } from "zod";
import {
  checkboxSchema,
  optionalUuidSchema,
  requiredText,
  uuidSchema,
} from "./common";

/** DB CHECK와 맞춘 상한. 내용은 텍스트로만 렌더한다(HTML 삽입 금지) */
export const ANNOUNCEMENT_CONTENT_MAX = 2000;

const announcementFields = {
  content: requiredText("공지 내용", ANNOUNCEMENT_CONTENT_MAX),
  isPinned: checkboxSchema,
};

/** 공지 작성 (F008, admin 이상). eventId가 없으면 그룹 공지 */
export const createAnnouncementInputSchema = z.object({
  groupId: uuidSchema,
  eventId: optionalUuidSchema,
  ...announcementFields,
});
export type CreateAnnouncementInput = z.infer<
  typeof createAnnouncementInputSchema
>;

/** 공지 수정·고정 토글 (admin 이상) */
export const updateAnnouncementInputSchema = z.object({
  announcementId: uuidSchema,
  ...announcementFields,
});
export type UpdateAnnouncementInput = z.infer<
  typeof updateAnnouncementInputSchema
>;

/** 공지 삭제 */
export const deleteAnnouncementInputSchema = z.object({
  announcementId: uuidSchema,
});
export type DeleteAnnouncementInput = z.infer<
  typeof deleteAnnouncementInputSchema
>;
