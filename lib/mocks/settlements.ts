import type {
  Expense,
  ExpenseShare,
  SettlementTransfer,
} from "@/lib/types/domain";
import {
  MOCK_EVENT_IDS as E,
  MOCK_EXPENSE_IDS as X,
  MOCK_USER_IDS as U,
  mockId,
} from "./ids";

/*
 * Task 024: 정산 전·송금 표시·입금 확인·잠금
 *
 * 금액은 PRD 정산 규칙대로 계산했다. 결제자가 아닌 분담자는 floor(금액 / 분담자 수),
 * 나머지는 결제자 몫이고, 송금은 (송금자, 결제자) 쌍별로 합산한 뒤 반대 방향 금액과 상계한다.
 *
 * - 8월 번개(정산 전): 저녁 10,000 ÷ 3 → 3,333씩(지우 3,334), 카페 6,000 ÷ 3 → 2,000씩
 *   민지→지우 3,333 - 2,000 = 1,333 / 준호→지우 3,333 / 준호→민지 2,000
 * - 9월 산행(송금 표시): 주차 12,000 ÷ 4 → 3,000씩, 간식 5,000 ÷ 2 → 2,500씩(나간 멤버 결제)
 * - 여름 MT(입금 확인·잠금): 숙소 90,000 ÷ 3 → 30,000, 장보기 25,000 ÷ 3 → 8,333(서연 8,334),
 *   입금 확인 뒤 숙소 환불 조정 -9,000 ÷ 3 → -3,000
 *   민지→지우 30,000 - 3,000 = 27,000 / 서연→지우 27,000 - 8,333 = 18,667 / 민지→서연 8,333(입금 확인)
 *   조정 금액은 나누어떨어지게 잡았다. 음수 나머지 처리는 결정 필요 사항 5번(Task 025)에서 정한다.
 */

export const MOCK_EXPENSES = [
  {
    id: X.augustDinner,
    eventId: E.settlementPending,
    name: "저녁 식사",
    amount: 10_000,
    payerId: U.me,
    isAdjustment: false,
    createdBy: U.me,
    createdAt: "2026-08-22T13:00:00.000Z",
  },
  {
    id: X.augustCafe,
    eventId: E.settlementPending,
    name: "카페",
    amount: 6_000,
    payerId: U.minji,
    isAdjustment: false,
    createdBy: U.minji,
    createdAt: "2026-08-22T14:00:00.000Z",
  },
  {
    id: X.septemberParking,
    eventId: E.completed,
    name: "주차비",
    amount: 12_000,
    payerId: U.junho,
    isAdjustment: false,
    createdBy: U.junho,
    createdAt: "2026-09-20T09:00:00.000Z",
  },
  {
    id: X.septemberSnack,
    eventId: E.completed,
    name: "간식",
    amount: 5_000,
    payerId: U.leftMember,
    isAdjustment: false,
    createdBy: U.leftMember,
    createdAt: "2026-09-20T10:00:00.000Z",
  },
  {
    id: X.summerLodging,
    eventId: E.settlementLocked,
    name: "숙소",
    amount: 90_000,
    payerId: U.me,
    isAdjustment: false,
    createdBy: U.me,
    createdAt: "2026-07-26T03:00:00.000Z",
  },
  {
    id: X.summerGroceries,
    eventId: E.settlementLocked,
    name: "장보기",
    amount: 25_000,
    payerId: U.seoyeon,
    isAdjustment: false,
    createdBy: U.seoyeon,
    createdAt: "2026-07-26T04:00:00.000Z",
  },
  {
    id: X.summerRefund,
    eventId: E.settlementLocked,
    name: "숙소 일부 환불",
    amount: -9_000,
    payerId: U.me,
    isAdjustment: true,
    createdBy: U.me,
    createdAt: "2026-08-05T03:00:00.000Z",
  },
] satisfies Expense[];

type ShareRow = [expenseId: string, userId: string, shareAmount: number];

const SHARE_ROWS: ShareRow[] = [
  [X.augustDinner, U.me, 3_334],
  [X.augustDinner, U.minji, 3_333],
  [X.augustDinner, U.junho, 3_333],
  [X.augustCafe, U.me, 2_000],
  [X.augustCafe, U.minji, 2_000],
  [X.augustCafe, U.junho, 2_000],
  [X.septemberParking, U.me, 3_000],
  [X.septemberParking, U.minji, 3_000],
  [X.septemberParking, U.junho, 3_000],
  [X.septemberParking, U.seoyeon, 3_000],
  [X.septemberSnack, U.me, 2_500],
  [X.septemberSnack, U.leftMember, 2_500],
  [X.summerLodging, U.me, 30_000],
  [X.summerLodging, U.minji, 30_000],
  [X.summerLodging, U.seoyeon, 30_000],
  [X.summerGroceries, U.me, 8_333],
  [X.summerGroceries, U.minji, 8_333],
  [X.summerGroceries, U.seoyeon, 8_334],
  [X.summerRefund, U.me, -3_000],
  [X.summerRefund, U.minji, -3_000],
  [X.summerRefund, U.seoyeon, -3_000],
];

export const MOCK_EXPENSE_SHARES = SHARE_ROWS.map(
  ([expenseId, userId, shareAmount], index) => ({
    id: mockId("share", index + 1),
    expenseId,
    userId,
    shareAmount,
  }),
) satisfies ExpenseShare[];

type TransferRow = [
  eventId: string,
  fromUserId: string,
  toUserId: string,
  amount: number,
  transferMarkedAt: string | null,
  confirmedAt: string | null,
];

const TRANSFER_ROWS: TransferRow[] = [
  // 정산 전: 아무도 송금 표시를 하지 않았다
  [E.settlementPending, U.minji, U.me, 1_333, null, null],
  [E.settlementPending, U.junho, U.me, 3_333, null, null],
  [E.settlementPending, U.junho, U.minji, 2_000, null, null],
  // 송금 표시: 일부만 송금 완료 표시, 입금 확인 없음 → 잠기지 않음
  [E.completed, U.me, U.junho, 3_000, "2026-09-21T01:00:00.000Z", null],
  [E.completed, U.minji, U.junho, 3_000, "2026-09-21T02:00:00.000Z", null],
  [E.completed, U.seoyeon, U.junho, 3_000, null, null],
  [E.completed, U.me, U.leftMember, 2_500, null, null],
  // 입금 확인·잠금: 민지→서연 입금 확인 → 이벤트 잠금
  [E.settlementLocked, U.minji, U.me, 27_000, "2026-07-28T01:00:00.000Z", null],
  [E.settlementLocked, U.seoyeon, U.me, 18_667, null, null],
  [
    E.settlementLocked,
    U.minji,
    U.seoyeon,
    8_333,
    "2026-07-27T01:00:00.000Z",
    "2026-07-27T05:00:00.000Z",
  ],
];

export const MOCK_SETTLEMENT_TRANSFERS = TRANSFER_ROWS.map(
  (
    [eventId, fromUserId, toUserId, amount, transferMarkedAt, confirmedAt],
    index,
  ) => ({
    id: mockId("transfer", index + 1),
    eventId,
    fromUserId,
    toUserId,
    amount,
    transferMarkedAt,
    confirmedAt,
  }),
) satisfies SettlementTransfer[];

export type MockSettlementBundle = {
  eventId: string;
  expenses: Expense[];
  shares: ExpenseShare[];
  transfers: SettlementTransfer[];
  /** 입금 확인된 송금이 하나라도 있으면 기존 항목 수정·삭제 잠금 */
  isLocked: boolean;
};

/**
 * 이벤트의 비용 항목·분담·송금 요약과 잠금 여부를 묶어 돌려준다.
 */
export function getMockSettlement(eventId: string): MockSettlementBundle {
  const expenses = MOCK_EXPENSES.filter((item) => item.eventId === eventId);
  const expenseIds = new Set(expenses.map((item) => item.id));
  const transfers = MOCK_SETTLEMENT_TRANSFERS.filter(
    (item) => item.eventId === eventId,
  );
  return {
    eventId,
    expenses,
    shares: MOCK_EXPENSE_SHARES.filter((item) =>
      expenseIds.has(item.expenseId),
    ),
    transfers,
    isLocked: transfers.some((item) => item.confirmedAt !== null),
  };
}

export const MOCK_SETTLEMENT_SCENARIOS = [
  "beforeSettlement",
  "transferMarked",
  "locked",
] as const;
export type MockSettlementScenario = (typeof MOCK_SETTLEMENT_SCENARIOS)[number];

const SETTLEMENT_SCENARIO_EVENT: Record<MockSettlementScenario, string> = {
  beforeSettlement: E.settlementPending,
  transferMarked: E.completed,
  locked: E.settlementLocked,
};

/**
 * 정산 페이지(Task 024)용 시나리오. locked에는 입금 확인 건과 조정 항목이 함께 들어 있다.
 */
export function getMockSettlementScenario(
  scenario: MockSettlementScenario,
): MockSettlementBundle {
  return getMockSettlement(SETTLEMENT_SCENARIO_EVENT[scenario]);
}
