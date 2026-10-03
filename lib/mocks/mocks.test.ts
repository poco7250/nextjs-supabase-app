import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { Expense, ExpenseShare } from "@/lib/types/domain";
import {
  MOCK_CARPOOLS,
  MOCK_CARPOOL_RIDERS,
  getMockCarpoolScenario,
} from "./carpools";
import {
  MOCK_ANNOUNCEMENTS,
  MOCK_EVENTS,
  MOCK_RSVPS,
  getMockEventScenario,
} from "./events";
import {
  LEFT_MEMBER_LABEL,
  MOCK_GROUPS,
  MOCK_GROUP_INVITES,
  MOCK_GROUP_MEMBERS,
  getMockDashboardGroups,
  getMockInviteScenario,
  getMockMemberDisplayName,
} from "./groups";
import { MOCK_GROUP_IDS, MOCK_USER_IDS as U } from "./ids";
import {
  MOCK_EXPENSES,
  MOCK_EXPENSE_SHARES,
  MOCK_SETTLEMENT_TRANSFERS,
  getMockSettlementScenario,
} from "./settlements";
import { MOCK_PROFILES } from "./users";

/**
 * PRD 정산 규칙으로 송금 요약을 다시 계산한다. 결제자가 아닌 분담자 몫을 (송금자→결제자) 쌍별로 더하고,
 * 반대 방향 금액과 상계해 양수인 쌍만 남긴다. 정식 구현은 Task 025의 lib/settlement/*다.
 */
function recalculateTransfers(expenses: Expense[], shares: ExpenseShare[]) {
  const pairs = new Map<string, number>();
  for (const expense of expenses) {
    for (const share of shares) {
      if (share.expenseId !== expense.id || share.userId === expense.payerId)
        continue;
      const key = `${share.userId}>${expense.payerId}`;
      pairs.set(key, (pairs.get(key) ?? 0) + share.shareAmount);
    }
  }
  const net = new Map<string, number>();
  for (const [key, amount] of pairs) {
    const [from, to] = key.split(">");
    const diff = amount - (pairs.get(`${to}>${from}`) ?? 0);
    if (diff > 0) net.set(key, diff);
  }
  return net;
}

const ALL_ROWS = [
  MOCK_PROFILES,
  MOCK_GROUPS,
  MOCK_GROUP_MEMBERS,
  MOCK_GROUP_INVITES,
  MOCK_EVENTS,
  MOCK_RSVPS,
  MOCK_ANNOUNCEMENTS,
  MOCK_CARPOOLS,
  MOCK_CARPOOL_RIDERS,
  MOCK_EXPENSES,
  MOCK_EXPENSE_SHARES,
  MOCK_SETTLEMENT_TRANSFERS,
];

describe("더미 id", () => {
  const ids = ALL_ROWS.flatMap((rows) => rows.map((row) => row.id));

  it("모든 id가 z.uuid()를 통과한다", () => {
    for (const id of ids) expect(z.uuid().safeParse(id).success, id).toBe(true);
  });

  it("id가 겹치지 않는다", () => {
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("더미 DB 제약 (docs/db-schema.md)", () => {
  it("대기자만 waitlistedAt이 있다", () => {
    for (const rsvp of MOCK_RSVPS) {
      expect(rsvp.status === "waitlisted").toBe(rsvp.waitlistedAt !== null);
    }
  });

  it("그룹당 활성 초대(revokedAt null)는 1개 이하다", () => {
    const active = MOCK_GROUP_INVITES.filter(
      (invite) => invite.revokedAt === null,
    );
    expect(new Set(active.map((invite) => invite.groupId)).size).toBe(
      active.length,
    );
  });

  it("송금은 자기 자신에게 하지 않고 금액이 양수이며, 입금 확인 전에 송금 표시가 있다", () => {
    for (const transfer of MOCK_SETTLEMENT_TRANSFERS) {
      expect(transfer.fromUserId).not.toBe(transfer.toUserId);
      expect(transfer.amount).toBeGreaterThan(0);
      if (transfer.confirmedAt)
        expect(transfer.transferMarkedAt).not.toBeNull();
    }
  });
});

describe("더미 정산 금액", () => {
  it.each(MOCK_EXPENSES.map((expense) => [expense.name, expense] as const))(
    "%s: 분담 합계가 금액과 같고 결제자가 아닌 분담자는 floor 몫이다",
    (_name, expense) => {
      const shares = MOCK_EXPENSE_SHARES.filter(
        (share) => share.expenseId === expense.id,
      );
      const floorShare = Math.floor(expense.amount / shares.length);
      expect(shares.reduce((sum, share) => sum + share.shareAmount, 0)).toBe(
        expense.amount,
      );
      for (const share of shares.filter(
        (item) => item.userId !== expense.payerId,
      )) {
        expect(share.shareAmount).toBe(floorShare);
      }
    },
  );

  it("PRD 예시대로 10,000원을 3명이 나누면 3,333원씩, 결제자는 3,334원이다", () => {
    const dinner = MOCK_EXPENSES.find(
      (expense) => expense.name === "저녁 식사",
    );
    const shares = MOCK_EXPENSE_SHARES.filter(
      (share) => share.expenseId === dinner?.id,
    );
    expect(shares.map((share) => share.shareAmount).sort()).toEqual([
      3333, 3333, 3334,
    ]);
  });

  it.each(["beforeSettlement", "transferMarked", "locked"] as const)(
    "%s: 송금 요약이 쌍별 합산·상계 재계산과 일치한다",
    (scenario) => {
      const { expenses, shares, transfers } =
        getMockSettlementScenario(scenario);
      const expected = recalculateTransfers(expenses, shares);
      const actual = new Map(
        transfers.map((t) => [`${t.fromUserId}>${t.toUserId}`, t.amount]),
      );
      expect(actual).toEqual(expected);
    },
  );
});

describe("Task 007 시나리오: 그룹·초대", () => {
  it.each(["valid", "alreadyMember", "expired", "invalid"] as const)(
    "초대 %s 상태를 돌려준다",
    (scenario) => {
      const result = getMockInviteScenario(scenario);
      expect(result.status).toBe(scenario);
      expect(result.group === null).toBe(
        scenario === "expired" || scenario === "invalid",
      );
    },
  );

  it("대시보드: 내 그룹 2개(owner·member), 그룹이 없으면 빈 상태", () => {
    const roles = getMockDashboardGroups(U.me).map((item) => item.role);
    expect(roles.sort()).toEqual(["member", "owner"]);
    expect(getMockDashboardGroups(U.leftMember)).toEqual([]);
  });

  it("내보낸 멤버는 '나간 멤버'로 표시한다", () => {
    expect(
      getMockMemberDisplayName(MOCK_GROUP_IDS.climbing, U.leftMember),
    ).toBe(LEFT_MEMBER_LABEL);
    expect(getMockMemberDisplayName(MOCK_GROUP_IDS.climbing, U.minji)).toBe(
      "이민지",
    );
  });
});

describe("Task 013 시나리오: 이벤트", () => {
  it("정원 초과: 참석자가 정원만큼 차 있고 대기자가 있다", () => {
    const { event, rsvps } = getMockEventScenario("overCapacity");
    expect(rsvps.filter((rsvp) => rsvp.status === "going")).toHaveLength(
      event.capacity ?? -1,
    );
    expect(rsvps.some((rsvp) => rsvp.status === "waitlisted")).toBe(true);
  });

  it.each([
    ["closed", "closed"],
    ["canceled", "canceled"],
    ["completed", "completed"],
    ["unlimited", "scheduled"],
  ] as const)("%s 시나리오의 상태는 %s다", (scenario, status) => {
    expect(getMockEventScenario(scenario).event.status).toBe(status);
  });

  it("정원 없음 이벤트는 capacity가 null이다", () => {
    expect(getMockEventScenario("unlimited").event.capacity).toBeNull();
  });
});

describe("Task 020 시나리오: 카풀", () => {
  it("만석과 잔여 있는 카풀이 함께 있고, 내가 탑승 중이다", () => {
    const { carpools, viewerId } = getMockCarpoolScenario("riding");
    expect(carpools.some((view) => view.remainingSeats === 0)).toBe(true);
    expect(carpools.some((view) => view.remainingSeats > 0)).toBe(true);
    expect(
      carpools.some((view) => view.riders.some((r) => r.riderId === viewerId)),
    ).toBe(true);
  });

  it("내가 운전자인 카풀이 있다", () => {
    const { carpools, viewerId } = getMockCarpoolScenario("driver");
    expect(carpools.some((view) => view.carpool.driverId === viewerId)).toBe(
      true,
    );
  });

  it("참석 확정자가 아니면 isAttendee가 false다", () => {
    expect(getMockCarpoolScenario("notAttendee").isAttendee).toBe(false);
    expect(getMockCarpoolScenario("full").isAttendee).toBe(true);
  });
});

describe("Task 024 시나리오: 정산", () => {
  it("정산 전: 송금 표시가 없고 잠기지 않았다", () => {
    const { transfers, isLocked } =
      getMockSettlementScenario("beforeSettlement");
    expect(transfers.every((t) => t.transferMarkedAt === null)).toBe(true);
    expect(isLocked).toBe(false);
  });

  it("송금 표시: 일부 송금 표시가 있지만 입금 확인이 없어 잠기지 않았다", () => {
    const { transfers, isLocked } = getMockSettlementScenario("transferMarked");
    expect(transfers.some((t) => t.transferMarkedAt !== null)).toBe(true);
    expect(isLocked).toBe(false);
  });

  it("입금 확인·잠금: 확인된 송금이 있어 잠기고, 조정 항목이 있다", () => {
    const { transfers, expenses, isLocked } =
      getMockSettlementScenario("locked");
    expect(transfers.some((t) => t.confirmedAt !== null)).toBe(true);
    expect(isLocked).toBe(true);
    expect(
      expenses.some((expense) => expense.isAdjustment && expense.amount < 0),
    ).toBe(true);
  });
});
