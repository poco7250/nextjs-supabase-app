import { GROUP_ROLES } from "@/lib/types/domain";
import { z } from "zod";
import { optionalText, requiredText, uuidSchema } from "./common";

/** DB CHECK(char_length)와 맞춘 길이 상한 */
export const GROUP_NAME_MAX = 50;
export const GROUP_DESCRIPTION_MAX = 500;

const groupFields = {
  name: requiredText("그룹명", GROUP_NAME_MAX),
  description: optionalText("그룹 설명", GROUP_DESCRIPTION_MAX),
};

/** 그룹 생성 (F001) */
export const createGroupInputSchema = z.object(groupFields);
export type CreateGroupInput = z.infer<typeof createGroupInputSchema>;

/** 그룹 수정 (F001, admin 이상) */
export const updateGroupInputSchema = z.object({
  groupId: uuidSchema,
  ...groupFields,
});
export type UpdateGroupInput = z.infer<typeof updateGroupInputSchema>;

/** 멤버 역할 변경 (F004) */
export const changeMemberRoleInputSchema = z.object({
  groupId: uuidSchema,
  userId: uuidSchema,
  role: z.enum(GROUP_ROLES, { error: "역할을 선택해 주세요." }),
});
export type ChangeMemberRoleInput = z.infer<typeof changeMemberRoleInputSchema>;

/** 멤버 내보내기 (F005) */
export const removeMemberInputSchema = z.object({
  groupId: uuidSchema,
  userId: uuidSchema,
});
export type RemoveMemberInput = z.infer<typeof removeMemberInputSchema>;
