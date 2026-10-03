"use server";

import { redirect } from "next/navigation";
import { routes } from "@/lib/constants/routes";
import {
  canChangeRole,
  canRemoveMember,
  isLastOwner,
  type MemberRef,
} from "@/lib/groups/member-permissions";
import {
  MOCK_GROUP_MEMBERS,
  getMockRole,
  resolveMockInvite,
} from "@/lib/mocks/groups";
import { MOCK_CURRENT_USER_ID } from "@/lib/mocks/ids";
import {
  type ActionState,
  fail,
  fromZodError,
  ok,
} from "@/lib/types/action-result";
import {
  changeMemberRoleInputSchema,
  removeMemberInputSchema,
} from "@/lib/validations/group";
import { acceptInviteInputSchema } from "@/lib/validations/invite";

/*
 * Task 007 더미 화면용 목 Server Action.
 * 실제 액션과 같은 시그니처((prevState, formData) → ActionResult)로 입력 검증과 권한 규칙만 거치고,
 * DB에는 아무것도 저장하지 않는다. Task 009에서 그룹 생성·수정·초대 재발급은 실제 액션으로 바꿨다. 남은 액션도 Task 010~011에서 교체한 뒤 이 파일을 지운다.
 */

const INVITE_ERROR_MESSAGE: Record<"expired" | "invalid", string> = {
  expired: "만료된 초대 링크예요. 관리자에게 새 링크를 요청해 주세요.",
  invalid: "유효하지 않은 초대 링크예요.",
};

/**
 * 그룹 멤버 관리 판정에 필요한 맥락(보는 사람, 대상, owner 수)을 더미 데이터에서 모은다.
 */
function getMemberContext(groupId: string, targetUserId: string) {
  const members = MOCK_GROUP_MEMBERS.filter(
    (member) => member.groupId === groupId,
  );
  const viewerRole = getMockRole(groupId, MOCK_CURRENT_USER_ID);
  const target = members.find((member) => member.userId === targetUserId);
  const ownerCount = members.filter((member) => member.role === "owner").length;
  const viewer: MemberRef | undefined = viewerRole
    ? { userId: MOCK_CURRENT_USER_ID, role: viewerRole }
    : undefined;
  return { viewer, target, ownerCount };
}

/**
 * 멤버 역할 변경 (F004). 마지막 owner 강등은 CONFLICT, 그 밖의 권한 위반은 FORBIDDEN.
 */
export async function changeMemberRoleMock(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = changeMemberRoleInputSchema.safeParse({
    groupId: formData.get("groupId"),
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return fromZodError(parsed.error);
  const { groupId, userId, role } = parsed.data;
  const { viewer, target, ownerCount } = getMemberContext(groupId, userId);
  if (!target) return fail("NOT_FOUND", "그룹 멤버를 찾을 수 없어요.");
  if (isLastOwner(target, ownerCount) && role !== "owner") {
    return fail("CONFLICT", "그룹에는 소유자가 최소 1명 있어야 해요.");
  }
  if (!canChangeRole(viewer?.role, target, role, ownerCount)) {
    return fail("FORBIDDEN", "이 멤버의 역할을 바꿀 수 없어요.");
  }
  return ok(null);
}

/**
 * 멤버 내보내기 (F005). 기록은 남기고 멤버십만 지운다(실제 구현 기준).
 */
export async function removeMemberMock(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = removeMemberInputSchema.safeParse({
    groupId: formData.get("groupId"),
    userId: formData.get("userId"),
  });
  if (!parsed.success) return fromZodError(parsed.error);
  const { viewer, target, ownerCount } = getMemberContext(
    parsed.data.groupId,
    parsed.data.userId,
  );
  if (!target) return fail("NOT_FOUND", "그룹 멤버를 찾을 수 없어요.");
  if (isLastOwner(target, ownerCount)) {
    return fail("CONFLICT", "마지막 소유자는 내보낼 수 없어요.");
  }
  if (!viewer || !canRemoveMember(viewer, target, ownerCount)) {
    return fail("FORBIDDEN", "이 멤버를 내보낼 수 없어요.");
  }
  return ok(null);
}

/**
 * 초대 수락 (F003). 무효·만료 토큰은 INVALID_INVITE, 유효하거나 이미 멤버면 그룹 홈으로 이동한다.
 */
export async function acceptInviteMock(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = acceptInviteInputSchema.safeParse({
    token: formData.get("token"),
  });
  if (!parsed.success) return fromZodError(parsed.error);
  const result = resolveMockInvite(parsed.data.token, MOCK_CURRENT_USER_ID);
  // status 유니온으로는 group이 좁혀지지 않아 group 존재 여부로 판정한다
  if (!result.group) {
    return fail("INVALID_INVITE", INVITE_ERROR_MESSAGE[result.status]);
  }
  redirect(routes.group(result.group.id));
}
