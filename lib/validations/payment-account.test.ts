import { describe, expect, it } from "vitest";
import { fieldErrorsOf } from "@/lib/test-utils/zod";
import { savePaymentAccountInputSchema } from "@/lib/validations/payment-account";

const TOSS_ERROR = "토스 송금 링크(https://toss.me/...)를 입력해 주세요.";

describe("savePaymentAccountInputSchema", () => {
  it("모두 비우면 null로 저장한다", () => {
    expect(
      savePaymentAccountInputSchema.parse({
        bankName: "",
        bankAccountNumber: "",
        tossLink: "",
      }),
    ).toEqual({ bankName: null, bankAccountNumber: null, tossLink: null });
  });

  it("숫자·하이픈 계좌번호와 https toss.me 링크는 통과한다", () => {
    const parsed = savePaymentAccountInputSchema.parse({
      bankName: "카카오뱅크",
      bankAccountNumber: "3333-01-1234567",
      tossLink: "https://toss.me/jiwoo",
    });
    expect(parsed.tossLink).toBe("https://toss.me/jiwoo");
  });

  it("문자가 섞인 계좌번호를 거부한다", () => {
    expect(
      fieldErrorsOf(savePaymentAccountInputSchema, {
        bankAccountNumber: "3333-01-abc",
      }),
    ).toEqual({
      bankAccountNumber: "계좌번호는 숫자와 하이픈(-)만 입력해 주세요.",
    });
  });

  it("http 링크와 허용하지 않은 호스트를 거부한다", () => {
    expect(
      fieldErrorsOf(savePaymentAccountInputSchema, {
        tossLink: "http://toss.me/jiwoo",
      }),
    ).toEqual({ tossLink: TOSS_ERROR });
    expect(
      fieldErrorsOf(savePaymentAccountInputSchema, {
        tossLink: "https://evil.example/toss.me",
      }),
    ).toEqual({ tossLink: TOSS_ERROR });
  });
});
