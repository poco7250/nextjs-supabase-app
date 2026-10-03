"use server";

import { routes } from "@/lib/constants/routes";
import * as groupService from "@/lib/services/group-service";
import { type ActionState, fromZodError } from "@/lib/types/action-result";
import {
  createGroupInputSchema,
  updateGroupInputSchema,
} from "@/lib/validations/group";
import { regenerateInviteInputSchema } from "@/lib/validations/invite";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/*
 * 그룹 Server Action (컨트롤러). FormData를 Zod로 검증해 service에 넘기고, 결과로 화면을 갱신한다.
 * 시그니처는 useActionState용 (prevState, formData) → ActionState다.
 */

/**
 * 그룹 생성 (F001). 성공하면 새 그룹 홈으로 이동한다.
 */
export async function createGroupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createGroupInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const result = await groupService.createGroup(parsed.data);
  if (!result.ok) return result;
  revalidatePath(routes.dashboard);
  redirect(routes.group(result.data.groupId));
}

/**
 * 그룹 정보 수정 (F001, admin 이상). 그룹 화면 전체(헤더·홈·설정)와 대시보드를 갱신한다.
 */
export async function updateGroupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateGroupInputSchema.safeParse({
    groupId: formData.get("groupId"),
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const result = await groupService.updateGroup(parsed.data);
  if (result.ok) {
    revalidatePath(routes.group(parsed.data.groupId), "layout");
    revalidatePath(routes.dashboard);
  }
  return result;
}

/**
 * 초대 링크 재발급 (F002, admin 이상). 새 토큰을 돌려준다.
 */
export async function regenerateInviteAction(
  _prev: ActionState<{ token: string }>,
  formData: FormData,
): Promise<ActionState<{ token: string }>> {
  const parsed = regenerateInviteInputSchema.safeParse({
    groupId: formData.get("groupId"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const result = await groupService.regenerateInvite(parsed.data);
  if (result.ok) revalidatePath(routes.groupSettings(parsed.data.groupId));
  return result;
}
