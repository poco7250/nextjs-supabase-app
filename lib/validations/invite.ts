import { z } from "zod";
import { uuidSchema } from "./common";

/**
 * 초대 토큰 형식. DB가 base64url 랜덤 문자열로 발급한다(docs/db-schema.md).
 * 형식이 틀리면 DB 조회 없이 "유효하지 않은 초대"로 처리할 수 있게 먼저 걸러 낸다.
 */
export const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

export const inviteTokenSchema = z
  .string({ error: "초대 링크가 올바르지 않아요." })
  .regex(INVITE_TOKEN_PATTERN, { error: "초대 링크가 올바르지 않아요." });

/** 초대 미리보기·수락 (F003) */
export const acceptInviteInputSchema = z.object({ token: inviteTokenSchema });
export type AcceptInviteInput = z.infer<typeof acceptInviteInputSchema>;

/** 초대 링크 재발급 (F002, admin 이상) */
export const regenerateInviteInputSchema = z.object({ groupId: uuidSchema });
export type RegenerateInviteInput = z.infer<typeof regenerateInviteInputSchema>;
