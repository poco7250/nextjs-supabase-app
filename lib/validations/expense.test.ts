import { describe, expect, it } from "vitest";
import { MOCK_EVENT_IDS, MOCK_USER_IDS as U } from "@/lib/mocks/ids";
import { fieldErrorsOf } from "@/lib/test-utils/zod";
import { createExpenseInputSchema } from "@/lib/validations/expense";

const AMOUNT_ERROR =
  "일반 항목 금액은 0원 이상, 조정 항목은 0원이 아니어야 해요.";

const validInput = {
  eventId: MOCK_EVENT_IDS.settlementPending,
  name: "저녁 식사",
  amount: "10000",
  payerId: U.me,
  sharerIds: [U.me, U.minji, U.junho],
};

describe("createExpenseInputSchema", () => {
  it("정상 입력은 통과하고 체크박스가 없으면 일반 항목이다", () => {
    const parsed = createExpenseInputSchema.parse(validInput);
    expect(parsed.amount).toBe(10000);
    expect(parsed.isAdjustment).toBe(false);
  });

  it("일반 항목의 음수 금액을 거부한다", () => {
    expect(
      fieldErrorsOf(createExpenseInputSchema, { ...validInput, amount: "-1" }),
    ).toEqual({
      amount: AMOUNT_ERROR,
    });
  });

  it("조정 항목은 음수를 허용하고 0원은 거부한다", () => {
    const adjustment = { ...validInput, isAdjustment: "on" };
    expect(
      createExpenseInputSchema.parse({ ...adjustment, amount: "-9000" }).amount,
    ).toBe(-9000);
    expect(
      fieldErrorsOf(createExpenseInputSchema, { ...adjustment, amount: "0" }),
    ).toEqual({
      amount: AMOUNT_ERROR,
    });
  });

  it("분담자가 0명이면 거부한다", () => {
    expect(
      fieldErrorsOf(createExpenseInputSchema, { ...validInput, sharerIds: [] }),
    ).toEqual({
      sharerIds: "분담자를 1명 이상 선택해 주세요.",
    });
  });

  it("같은 분담자를 중복 선택하면 거부한다", () => {
    expect(
      fieldErrorsOf(createExpenseInputSchema, {
        ...validInput,
        sharerIds: [U.me, U.me],
      }),
    ).toEqual({ sharerIds: "같은 분담자를 두 번 선택할 수 없어요." });
  });
});
