import { logger } from "@/lib/logger";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { GROUP_ROLES, type Group, type GroupRole } from "@/lib/types/domain";
import type {
  CreateGroupInput,
  UpdateGroupInput,
} from "@/lib/validations/group";
import { type DbError, toDbError } from "./db-error";

/*
 * 그룹·멤버십·초대 데이터 접근. 에러는 로그를 남기고 DbError로 throw한다(service가 ActionResult로 바꾼다).
 * 읽기는 RLS에 맡긴다. 비멤버가 조회하면 행이 없어서 null·빈 배열이 된다.
 */

type GroupRow = Pick<
  Database["public"]["Tables"]["groups"]["Row"],
  "id" | "name" | "description" | "owner_id" | "created_at"
>;

const GROUP_COLUMNS = "id, name, description, owner_id, created_at";

/** 대시보드 카드용: 그룹 + 내 역할 + 멤버 수 */
export type MyGroup = { group: Group; role: GroupRole; memberCount: number };

/**
 * DB 행을 도메인 모델로 바꾼다.
 */
function toGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.owner_id,
    createdAt: row.created_at,
  };
}

/**
 * DB의 role 문자열을 GroupRole로 좁힌다. CHECK 제약이 있어 실패하면 데이터 이상이다.
 */
function toGroupRole(role: string): GroupRole {
  if ((GROUP_ROLES as readonly string[]).includes(role)) {
    return role as GroupRole;
  }
  throw new Error(`알 수 없는 그룹 역할: ${role}`);
}

/**
 * 에러를 DbError로 바꾸고 로그를 남긴다. 권한·충돌 같은 예상 실패는 warn, 그 밖은 error.
 */
function reportError(
  action: string,
  error: { code?: string; message?: string },
): DbError {
  const dbError = toDbError(error);
  const log = dbError.code === "INTERNAL" ? logger.error : logger.warn;
  log("group-repository", `${action} 실패`, error);
  return dbError;
}

/**
 * 그룹을 만든다(create_group RPC: 그룹 + owner 멤버 + 첫 초대). 새 그룹 id를 돌려준다.
 */
export async function createGroup(input: CreateGroupInput): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_group", {
    p_name: input.name,
    p_description: input.description ?? "",
  });
  if (error) throw reportError("그룹 생성", error);
  return data;
}

/**
 * 그룹명·설명을 수정한다(RLS: admin 이상). 수정된 행이 없으면 false(권한 없음 또는 없는 그룹).
 */
export async function updateGroup(input: UpdateGroupInput): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .update({ name: input.name, description: input.description })
    .eq("id", input.groupId)
    .select("id");
  if (error) throw reportError("그룹 수정", error);
  return data.length > 0;
}

/**
 * 그룹 하나를 가져온다. 없거나 멤버가 아니면 null.
 */
export async function findGroup(groupId: string): Promise<Group | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .select(GROUP_COLUMNS)
    .eq("id", groupId)
    .maybeSingle();
  if (error) throw reportError("그룹 조회", error);
  return data ? toGroup(data) : null;
}

/**
 * 사용자의 그룹 내 역할. 멤버가 아니면 null.
 */
export async function findMemberRole(
  groupId: string,
  userId: string,
): Promise<GroupRole | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw reportError("멤버 역할 조회", error);
  return data ? toGroupRole(data.role) : null;
}

/**
 * 그룹 멤버 수.
 */
export async function countMembers(groupId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);
  if (error) throw reportError("멤버 수 조회", error);
  return count ?? 0;
}

/**
 * 내가 속한 그룹 목록(가입 순)과 각 그룹의 내 역할·멤버 수.
 */
export async function listMyGroups(userId: string): Promise<MyGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_members")
    .select(`role, groups!inner(${GROUP_COLUMNS}, group_members(count))`)
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });
  if (error) throw reportError("내 그룹 목록 조회", error);
  return data.map(({ role, groups }) => ({
    group: toGroup(groups),
    role: toGroupRole(role),
    memberCount: groups.group_members[0]?.count ?? 0,
  }));
}

/**
 * 그룹의 활성 초대(RLS: admin만 조회 가능). 없으면 null.
 */
export async function findActiveInvite(
  groupId: string,
): Promise<{ token: string; expiresAt: string | null } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_invites")
    .select("token, expires_at")
    .eq("group_id", groupId)
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw reportError("활성 초대 조회", error);
  return data ? { token: data.token, expiresAt: data.expires_at } : null;
}

/**
 * 초대 링크를 재발급한다(regenerate_invite RPC). 새 토큰을 돌려준다.
 */
export async function regenerateInvite(groupId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("regenerate_invite", {
    p_group_id: groupId,
  });
  if (error) throw reportError("초대 재발급", error);
  return data;
}
