import { z } from "zod";
import { optionalText } from "./common";

/** DB CHECK와 맞춘 상한 */
export const BANK_NAME_MAX = 30;
export const BANK_ACCOUNT_NUMBER_MAX = 30;
export const TOSS_LINK_MAX = 200;

/**
 * 허용하는 토스 송금 링크 호스트. 잠정값이며 Task 027에서 실제 링크 형식을 확인해 확정한다.
 */
export const TOSS_LINK_HOSTS = ["toss.me"] as const;

/** 숫자와 하이픈만 허용 */
const ACCOUNT_NUMBER_PATTERN = /^[0-9-]+$/;

/**
 * https이고 허용 호스트인 URL인지 확인한다.
 */
function isAllowedTossLink(value: string) {
  try {
    const url = new URL(value);
    const hosts: readonly string[] = TOSS_LINK_HOSTS;
    return url.protocol === "https:" && hosts.includes(url.hostname);
  } catch {
    return false;
  }
}

/** 계좌 정보 저장 (F021). 모두 선택 입력이며, 값이 있으면 형식을 검사한다 */
export const savePaymentAccountInputSchema = z.object({
  bankName: optionalText("은행명", BANK_NAME_MAX),
  bankAccountNumber: optionalText("계좌번호", BANK_ACCOUNT_NUMBER_MAX).refine(
    (value) => value === null || ACCOUNT_NUMBER_PATTERN.test(value),
    { error: "계좌번호는 숫자와 하이픈(-)만 입력해 주세요." },
  ),
  tossLink: optionalText("토스 송금 링크", TOSS_LINK_MAX).refine(
    (value) => value === null || isAllowedTossLink(value),
    { error: "토스 송금 링크(https://toss.me/...)를 입력해 주세요." },
  ),
});
export type SavePaymentAccountInput = z.infer<
  typeof savePaymentAccountInputSchema
>;
