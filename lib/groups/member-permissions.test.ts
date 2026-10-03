import { describe, expect, it } from "vitest";
import {
  canChangeRole,
  canManageMembers,
  canRemoveMember,
  getAssignableRoles,
  isLastOwner,
  type MemberRef,
} from "@/lib/groups/member-permissions";

const owner: MemberRef = { userId: "owner", role: "owner" };
const owner2: MemberRef = { userId: "owner2", role: "owner" };
const admin: MemberRef = { userId: "admin", role: "admin" };
const admin2: MemberRef = { userId: "admin2", role: "admin" };
const member: MemberRef = { userId: "member", role: "member" };

describe("canManageMembers", () => {
  it("owner·admin만 멤버를 관리한다", () => {
    expect(canManageMembers("owner")).toBe(true);
    expect(canManageMembers("admin")).toBe(true);
    expect(canManageMembers("member")).toBe(false);
    expect(canManageMembers(undefined)).toBe(false);
  });
});

describe("getAssignableRoles", () => {
  it("owner는 다른 멤버에게 모든 역할을 줄 수 있다", () => {
    expect(getAssignableRoles("owner", member, 1)).toEqual([
      "owner",
      "admin",
      "member",
    ]);
  });

  it("마지막 owner는 강등할 수 없다", () => {
    expect(getAssignableRoles("owner", owner, 1)).toEqual([]);
    expect(getAssignableRoles("owner", owner2, 2)).toEqual([
      "owner",
      "admin",
      "member",
    ]);
  });

  it("admin은 owner를 바꿀 수 없고 owner로 올릴 수도 없다", () => {
    expect(getAssignableRoles("admin", owner, 2)).toEqual([]);
    expect(getAssignableRoles("admin", member, 1)).toEqual(["admin", "member"]);
  });

  it("member는 아무 역할도 바꿀 수 없다", () => {
    expect(getAssignableRoles("member", admin, 1)).toEqual([]);
  });
});

describe("canChangeRole", () => {
  it("허용된 역할로만, 현재와 다른 역할로만 바꿀 수 있다", () => {
    expect(canChangeRole("owner", member, "admin", 1)).toBe(true);
    expect(canChangeRole("owner", member, "member", 1)).toBe(false);
    expect(canChangeRole("admin", member, "owner", 1)).toBe(false);
    expect(canChangeRole("owner", owner, "member", 1)).toBe(false);
  });
});

describe("canRemoveMember", () => {
  it("관리자는 일반 멤버와 다른 admin을 내보낼 수 있다", () => {
    expect(canRemoveMember(owner, member, 1)).toBe(true);
    expect(canRemoveMember(admin, admin2, 1)).toBe(true);
  });

  it("자기 자신은 내보낼 수 없다", () => {
    expect(canRemoveMember(admin, admin, 1)).toBe(false);
  });

  it("admin은 owner를 내보낼 수 없다", () => {
    expect(canRemoveMember(admin, owner, 2)).toBe(false);
  });

  it("owner는 다른 owner가 있을 때만 owner를 내보낼 수 있다", () => {
    expect(canRemoveMember(owner, owner2, 2)).toBe(true);
    expect(canRemoveMember(owner, owner2, 1)).toBe(false);
  });

  it("member는 아무도 내보낼 수 없다", () => {
    expect(canRemoveMember(member, admin, 1)).toBe(false);
  });
});

describe("isLastOwner", () => {
  it("owner가 1명뿐일 때 그 owner면 true다", () => {
    expect(isLastOwner(owner, 1)).toBe(true);
    expect(isLastOwner(owner, 2)).toBe(false);
    expect(isLastOwner(member, 1)).toBe(false);
  });
});
