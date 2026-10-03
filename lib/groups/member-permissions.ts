import { GROUP_ROLES, type GroupRole } from "@/lib/types/domain";

/**
 * 그룹 멤버 관리 권한 규칙. 화면(버튼 노출)과 Server Action(서버 검증)이 같은 기준을 쓴다.
 * DB RPC `change_member_role`/`remove_member`(docs/db-schema.md §6.2)도 같은 규칙으로 구현한다.
 */

export type MemberRef = { userId: string; role: GroupRole };

/**
 * 멤버 관리(역할 변경·내보내기·초대 재발급·그룹 수정)를 할 수 있는 역할인지 판정한다.
 */
export function canManageMembers(role: GroupRole | undefined): boolean {
  return role === "owner" || role === "admin";
}

/**
 * 대상 멤버에게 지정할 수 있는 역할 목록(현재 역할 포함). 길이가 1 이하면 역할을 바꿀 수 없다.
 * - admin은 owner를 바꾸거나 누구도 owner로 올릴 수 없다.
 * - 마지막 owner는 강등할 수 없다.
 */
export function getAssignableRoles(
  viewerRole: GroupRole | undefined,
  target: MemberRef,
  ownerCount: number,
): GroupRole[] {
  if (!canManageMembers(viewerRole)) return [];
  if (viewerRole === "admin") {
    return target.role === "owner" ? [] : ["admin", "member"];
  }
  if (target.role === "owner" && ownerCount <= 1) return [];
  return [...GROUP_ROLES];
}

/**
 * 대상 멤버의 역할을 nextRole로 바꿀 수 있는지 판정한다. 같은 역할로의 변경은 허용하지 않는다.
 */
export function canChangeRole(
  viewerRole: GroupRole | undefined,
  target: MemberRef,
  nextRole: GroupRole,
  ownerCount: number,
): boolean {
  if (target.role === nextRole) return false;
  return getAssignableRoles(viewerRole, target, ownerCount).includes(nextRole);
}

/**
 * 대상 멤버를 내보낼 수 있는지 판정한다.
 * 자기 자신, (admin이 볼 때) owner, 마지막 owner는 내보낼 수 없다.
 */
export function canRemoveMember(
  viewer: MemberRef,
  target: MemberRef,
  ownerCount: number,
): boolean {
  if (!canManageMembers(viewer.role)) return false;
  if (viewer.userId === target.userId) return false;
  if (target.role !== "owner") return true;
  return viewer.role === "owner" && ownerCount > 1;
}

/**
 * 마지막 owner를 강등·내보내려는 요청인지 판정한다. 권한 부족(FORBIDDEN)과 구분해 CONFLICT로 알릴 때 쓴다.
 */
export function isLastOwner(target: MemberRef, ownerCount: number): boolean {
  return target.role === "owner" && ownerCount <= 1;
}
