import { z } from "zod";
import {
  checkboxSchema,
  requiredText,
  uuidSchema,
  wonAmountSchema,
} from "./common";

/** DB CHECK와 맞춘 상한 */
export const EXPENSE_NAME_MAX = 100;

const expenseFields = {
  name: requiredText("항목명", EXPENSE_NAME_MAX),
  amount: wonAmountSchema("금액"),
  payerId: uuidSchema,
  sharerIds: z
    .array(uuidSchema, { error: "분담자를 선택해 주세요." })
    .min(1, { error: "분담자를 1명 이상 선택해 주세요." }),
  /** 입금 확인 후 정정용 조정 항목. 이 경우에만 음수 금액 허용 */
  isAdjustment: checkboxSchema,
};

type AmountFields = { amount: number; isAdjustment: boolean };

/**
 * 일반 항목은 0 이상, 조정 항목은 0이 아닌 금액이어야 한다.
 */
function isValidAmount({ amount, isAdjustment }: AmountFields) {
  return isAdjustment ? amount !== 0 : amount >= 0;
}

const amountRule = {
  error: "일반 항목 금액은 0원 이상, 조정 항목은 0원이 아니어야 해요.",
  path: ["amount"],
};

/**
 * 분담자 목록에 중복이 없는지 확인한다(expense_shares 유니크 제약과 일치).
 */
function hasUniqueSharers({ sharerIds }: { sharerIds: string[] }) {
  return new Set(sharerIds).size === sharerIds.length;
}

const sharerRule = {
  error: "같은 분담자를 두 번 선택할 수 없어요.",
  path: ["sharerIds"],
};

/** 비용 항목 등록 (F014, 참석자) */
export const createExpenseInputSchema = z
  .object({ eventId: uuidSchema, ...expenseFields })
  .refine(isValidAmount, amountRule)
  .refine(hasUniqueSharers, sharerRule);
export type CreateExpenseInput = z.infer<typeof createExpenseInputSchema>;

/** 비용 항목 수정. 입금 확인된 이벤트면 DB(RPC)가 거부한다 */
export const updateExpenseInputSchema = z
  .object({ expenseId: uuidSchema, ...expenseFields })
  .refine(isValidAmount, amountRule)
  .refine(hasUniqueSharers, sharerRule);
export type UpdateExpenseInput = z.infer<typeof updateExpenseInputSchema>;

/** 비용 항목 삭제 */
export const deleteExpenseInputSchema = z.object({ expenseId: uuidSchema });
export type DeleteExpenseInput = z.infer<typeof deleteExpenseInputSchema>;

/** 송금 완료 표시(송금자) / 입금 확인(받는 사람) (F015) */
export const transferIdInputSchema = z.object({ transferId: uuidSchema });
export type TransferIdInput = z.infer<typeof transferIdInputSchema>;
