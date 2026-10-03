import {
  GROUP_ROLES,
  type Event,
  type Group,
  type GroupInvite,
  type GroupMember,
  type GroupRole,
  type Profile,
} from "@/lib/types/domain";
import { getMockNextEvent } from "./events";
import {
  MOCK_GROUP_IDS as G,
  MOCK_INVITE_IDS as I,
  MOCK_NOW,
  MOCK_USER_IDS as U,
  mockId,
} from "./ids";
import { getMockProfile } from "./users";

/* Task 007: 그룹·멤버 역할·초대(유효/만료/무효/이미 멤버) */

/** 내보낸 멤버의 표시 이름 (PRD: 이력은 보존하고 "나간 멤버"로 표기) */
export const LEFT_MEMBER_LABEL = "나간 멤버";

export const MOCK_GROUPS = [
  {
    id: G.climbing,
    name: "주말 등반 모임",
    description: "매달 셋째 주 일요일 정기 산행",
    ownerId: U.me,
    createdAt: "2026-06-01T01:00:00.000Z",
  },
  {
    id: G.bookClub,
    name: "합정 독서 모임",
    description: null,
    ownerId: U.minji,
    createdAt: "2026-07-01T01:00:00.000Z",
  },
  {
    id: G.running,
    name: "한강 러닝 크루",
    description: "화·목 저녁 7시 반포 한강공원",
    ownerId: U.junho,
    createdAt: "2026-08-01T01:00:00.000Z",
  },
] satisfies Group[];

type MemberRow = [
  groupId: string,
  userId: string,
  role: GroupRole,
  joinedAt: string,
];

/** 하늘(leftMember)은 등반 모임에서 내보내져 멤버 행이 없다 */
const MEMBER_ROWS: MemberRow[] = [
  [G.climbing, U.me, "owner", "2026-06-01T01:00:00.000Z"],
  [G.climbing, U.minji, "admin", "2026-06-02T01:00:00.000Z"],
  [G.climbing, U.junho, "member", "2026-06-10T01:00:00.000Z"],
  [G.climbing, U.seoyeon, "member", "2026-07-05T01:00:00.000Z"],
  [G.bookClub, U.minji, "owner", "2026-07-01T01:00:00.000Z"],
  [G.bookClub, U.seoyeon, "admin", "2026-07-02T01:00:00.000Z"],
  [G.bookClub, U.me, "member", "2026-07-03T01:00:00.000Z"],
  [G.running, U.junho, "owner", "2026-08-01T01:00:00.000Z"],
  [G.running, U.seoyeon, "member", "2026-08-03T01:00:00.000Z"],
];

export const MOCK_GROUP_MEMBERS = MEMBER_ROWS.map(
  ([groupId, userId, role, joinedAt], index) => ({
    id: mockId("member", index + 1),
    groupId,
    userId,
    role,
    joinedAt,
  }),
) satisfies GroupMember[];

/** 그룹당 revokedAt이 null인 초대는 1개다(DB 부분 유니크). 만료는 expiresAt으로만 판정 */
export const MOCK_GROUP_INVITES = [
  {
    id: I.climbingActive,
    groupId: G.climbing,
    token: "climbingActiveToken2026",
    createdBy: U.me,
    expiresAt: "2026-10-31T15:00:00.000Z",
    revokedAt: null,
  },
  {
    id: I.climbingRevoked,
    groupId: G.climbing,
    token: "climbingRevokedToken2026",
    createdBy: U.me,
    expiresAt: null,
    revokedAt: "2026-09-15T01:00:00.000Z",
  },
  {
    id: I.bookClubExpired,
    groupId: G.bookClub,
    token: "bookClubExpiredToken2026",
    createdBy: U.minji,
    expiresAt: "2026-09-30T15:00:00.000Z",
    revokedAt: null,
  },
  {
    id: I.runningActive,
    groupId: G.running,
    token: "runningActiveToken2026",
    createdBy: U.junho,
    expiresAt: null,
    revokedAt: null,
  },
] satisfies GroupInvite[];

/**
 * 사용자의 그룹 내 역할. 멤버가 아니면 undefined.
 */
export function getMockRole(groupId: string, userId: string) {
  return MOCK_GROUP_MEMBERS.find(
    (member) => member.groupId === groupId && member.userId === userId,
  )?.role;
}

/**
 * 멤버 관리 화면용: 그룹 멤버와 프로필(역할 순 → 가입일 순).
 */
export function getMockGroupMembers(
  groupId: string,
): { member: GroupMember; profile: Profile | undefined }[] {
  return MOCK_GROUP_MEMBERS.filter((member) => member.groupId === groupId)
    .sort(
      (a, b) =>
        GROUP_ROLES.indexOf(a.role) - GROUP_ROLES.indexOf(b.role) ||
        a.joinedAt.localeCompare(b.joinedAt),
    )
    .map((member) => ({ member, profile: getMockProfile(member.userId) }));
}

/**
 * 이력 화면의 표시 이름. 현재 그룹 멤버가 아니면 "나간 멤버"로 표기한다.
 */
export function getMockMemberDisplayName(groupId: string, userId: string) {
  if (!getMockRole(groupId, userId)) return LEFT_MEMBER_LABEL;
  return getMockProfile(userId)?.fullName ?? "이름 없음";
}

export type MockDashboardGroup = {
  group: Group;
  role: GroupRole;
  memberCount: number;
  nextEvent: Event | undefined;
};

/**
 * 대시보드 그룹 카드 목록. 가입한 그룹이 없으면 빈 배열(빈 상태, 예: leftMember).
 */
export function getMockDashboardGroups(userId: string): MockDashboardGroup[] {
  return MOCK_GROUP_MEMBERS.filter((member) => member.userId === userId).map(
    (member) => ({
      group: MOCK_GROUPS.find((group) => group.id === member.groupId)!,
      role: member.role,
      memberCount: MOCK_GROUP_MEMBERS.filter(
        (item) => item.groupId === member.groupId,
      ).length,
      nextEvent: getMockNextEvent(member.groupId, MOCK_NOW),
    }),
  );
}

export const MOCK_INVITE_SCENARIOS = [
  "valid",
  "alreadyMember",
  "expired",
  "invalid",
] as const;
export type MockInviteScenario = (typeof MOCK_INVITE_SCENARIOS)[number];

export type MockInviteResult =
  | { status: "valid" | "alreadyMember"; group: Group }
  | { status: "expired" | "invalid"; group: null };

/**
 * 초대 토큰을 판정한다. 없거나 재발급으로 무효화된 토큰은 invalid, 기한이 지났으면 expired.
 */
export function resolveMockInvite(
  token: string,
  viewerId: string,
): MockInviteResult {
  const invite = MOCK_GROUP_INVITES.find((item) => item.token === token);
  if (!invite || invite.revokedAt) return { status: "invalid", group: null };
  if (invite.expiresAt && invite.expiresAt <= MOCK_NOW) {
    return { status: "expired", group: null };
  }
  const group = MOCK_GROUPS.find((item) => item.id === invite.groupId)!;
  const isMember = Boolean(getMockRole(group.id, viewerId));
  return { status: isMember ? "alreadyMember" : "valid", group };
}

const INVITE_SCENARIO_TOKEN: Record<MockInviteScenario, string> = {
  valid: "runningActiveToken2026",
  alreadyMember: "climbingActiveToken2026",
  expired: "bookClubExpiredToken2026",
  invalid: "climbingRevokedToken2026",
};

/**
 * 초대 수락 화면(Task 007)용 시나리오. 기본 로그인 사용자(김지우) 시점으로 판정한다.
 */
export function getMockInviteScenario(scenario: MockInviteScenario) {
  const token = INVITE_SCENARIO_TOKEN[scenario];
  return { token, ...resolveMockInvite(token, U.me) };
}
