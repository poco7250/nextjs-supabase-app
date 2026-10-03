import { canManageMembers } from "@/lib/groups/member-permissions";
import { logger } from "@/lib/logger";
import { getCurrentUserId } from "@/lib/repositories/auth-repository";
import { DbError } from "@/lib/repositories/db-error";
import * as groupRepository from "@/lib/repositories/group-repository";
import type { MyGroup } from "@/lib/repositories/group-repository";
import {
  type ActionErrorCode,
  type ActionResult,
  fail,
  ok,
} from "@/lib/types/action-result";
import type { Group, GroupRole } from "@/lib/types/domain";
import { uuidSchema } from "@/lib/validations/common";
import { unstable_rethrow } from "next/navigation";
import type {
  CreateGroupInput,
  UpdateGroupInput,
} from "@/lib/validations/group";
import type { RegenerateInviteInput } from "@/lib/validations/invite";

/*
 * 그룹 도메인 서비스 (F001, F002, F022). 권한 판정과 사용자 문구를 맡고, 데이터 접근은 group-repository에 맡긴다.
 */

const NOT_FOUND_MESSAGE = "그룹을 찾을 수 없어요.";
const NOT_ADMIN_MESSAGE = "그룹 관리자만 할 수 있어요.";

/** DB가 문구 없이 표준 SQLSTATE로 실패했을 때 보여줄 문구 */
const DEFAULT_MESSAGE: Partial<Record<ActionErrorCode, string>> = {
  VALIDATION: "입력값을 확인해 주세요.",
  FORBIDDEN: "권한이 없어요.",
  NOT_FOUND: NOT_FOUND_MESSAGE,
  CONFLICT: "이미 처리된 요청이에요.",
};

/**
 * 서비스 본문을 실행하고 예외를 ActionResult로 바꾼다. 예상하지 못한 오류만 error 로그를 남긴다.
 */
async function run<T>(
  action: string,
  body: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await body();
  } catch (error) {
    // 프리렌더 중단·notFound·redirect 같은 Next 내부 신호는 삼키지 않고 다시 던진다
    unstable_rethrow(error);
    if (error instanceof DbError && error.code !== "INTERNAL") {
      return fail(
        error.code,
        error.message || DEFAULT_MESSAGE[error.code] || "",
      );
    }
    logger.error("group-service", `${action} 실패`, error);
    return fail("INTERNAL", "잠시 후 다시 시도해 주세요.");
  }
}

type Viewer = { userId: string; role: GroupRole };

/**
 * 그룹을 보는 사람의 id와 역할. 로그인 안 했으면 UNAUTHENTICATED, 형식이 틀린 id·비멤버면 NOT_FOUND.
 */
async function getViewer(groupId: string): Promise<ActionResult<Viewer>> {
  if (!uuidSchema.safeParse(groupId).success) {
    return fail("NOT_FOUND", NOT_FOUND_MESSAGE);
  }
  const userId = await getCurrentUserId();
  if (!userId) return fail("UNAUTHENTICATED", "로그인이 필요해요.");
  const role = await groupRepository.findMemberRole(groupId, userId);
  if (!role) return fail("NOT_FOUND", NOT_FOUND_MESSAGE);
  return ok({ userId, role });
}

/**
 * 관리자(owner/admin)인 viewer만 통과시킨다.
 */
async function getAdminViewer(groupId: string): Promise<ActionResult<Viewer>> {
  const viewer = await getViewer(groupId);
  if (viewer.ok && !canManageMembers(viewer.data.role)) {
    return fail("FORBIDDEN", NOT_ADMIN_MESSAGE);
  }
  return viewer;
}

/**
 * 그룹을 만든다. 만든 사람이 owner가 되고 첫 초대 링크가 함께 생긴다.
 */
export function createGroup(
  input: CreateGroupInput,
): Promise<ActionResult<{ groupId: string }>> {
  return run("그룹 생성", async () =>
    ok({ groupId: await groupRepository.createGroup(input) }),
  );
}

/**
 * 그룹명·설명을 수정한다(admin 이상).
 */
export function updateGroup(
  input: UpdateGroupInput,
): Promise<ActionResult<null>> {
  return run("그룹 수정", async () => {
    const viewer = await getAdminViewer(input.groupId);
    if (!viewer.ok) return viewer;
    const updated = await groupRepository.updateGroup(input);
    return updated ? ok(null) : fail("FORBIDDEN", NOT_ADMIN_MESSAGE);
  });
}

/**
 * 내 역할. 그룹 레이아웃이 비멤버 404와 하단 탭 구성에 쓴다.
 */
export function getMyRole(groupId: string): Promise<ActionResult<GroupRole>> {
  return run("내 역할 조회", async () => {
    const viewer = await getViewer(groupId);
    return viewer.ok ? ok(viewer.data.role) : viewer;
  });
}

export type GroupHome = { group: Group; role: GroupRole; memberCount: number };

/**
 * 그룹 홈 정보: 그룹, 내 역할, 멤버 수.
 */
export function getGroupHome(
  groupId: string,
): Promise<ActionResult<GroupHome>> {
  return run("그룹 홈 조회", async () => {
    const viewer = await getViewer(groupId);
    if (!viewer.ok) return viewer;
    const [group, memberCount] = await Promise.all([
      groupRepository.findGroup(groupId),
      groupRepository.countMembers(groupId),
    ]);
    if (!group) return fail("NOT_FOUND", NOT_FOUND_MESSAGE);
    return ok({ group, role: viewer.data.role, memberCount });
  });
}

export type GroupSettings = {
  group: Group;
  invite: { token: string; expiresAt: string | null } | null;
};

/**
 * 그룹 설정 화면 정보(admin 이상): 그룹과 활성 초대.
 */
export function getGroupSettings(
  groupId: string,
): Promise<ActionResult<GroupSettings>> {
  return run("그룹 설정 조회", async () => {
    const viewer = await getAdminViewer(groupId);
    if (!viewer.ok) return viewer;
    const [group, invite] = await Promise.all([
      groupRepository.findGroup(groupId),
      groupRepository.findActiveInvite(groupId),
    ]);
    if (!group) return fail("NOT_FOUND", NOT_FOUND_MESSAGE);
    return ok({ group, invite });
  });
}

/**
 * 대시보드: 내가 속한 그룹 목록.
 */
export function listMyGroups(): Promise<ActionResult<MyGroup[]>> {
  return run("내 그룹 목록 조회", async () => {
    const userId = await getCurrentUserId();
    if (!userId) return fail("UNAUTHENTICATED", "로그인이 필요해요.");
    return ok(await groupRepository.listMyGroups(userId));
  });
}

/**
 * 초대 링크 재발급(admin 이상). 기존 링크는 즉시 무효가 된다.
 */
export function regenerateInvite(
  input: RegenerateInviteInput,
): Promise<ActionResult<{ token: string }>> {
  return run("초대 재발급", async () =>
    ok({ token: await groupRepository.regenerateInvite(input.groupId) }),
  );
}
