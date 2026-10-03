import { describe, expect, it } from "vitest";
import {
  checkboxSchema,
  dateTimeSchema,
  optionalPositiveIntSchema,
  optionalText,
  positiveIntSchema,
  requiredText,
  wonAmountSchema,
  withJosa,
} from "@/lib/validations/common";

/** 실패한 파싱의 첫 메시지 */
function firstMessage(result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) {
  return result.error?.issues[0]?.message;
}

describe("withJosa", () => {
  it("받침 여부에 맞는 조사를 붙인다", () => {
    expect(withJosa("그룹명", "을/를")).toBe("그룹명을");
    expect(withJosa("좌석 수", "은/는")).toBe("좌석 수는");
    expect(withJosa("이벤트", "이/가")).toBe("이벤트가");
  });

  it("끝 글자가 한글이 아니면 두 조사를 함께 적는다", () => {
    expect(withJosa("URL", "을/를")).toBe("URL을(를)");
  });
});

describe("텍스트", () => {
  it("필수 텍스트는 공백을 지우고, 비어 있으면 한국어 메시지로 거부한다", () => {
    const schema = requiredText("그룹명", 5);
    expect(schema.parse("  모임  ")).toBe("모임");
    expect(firstMessage(schema.safeParse("   "))).toBe(
      "그룹명을 입력해 주세요.",
    );
    expect(firstMessage(schema.safeParse("여섯글자이름"))).toBe(
      "그룹명은 5자 이하로 입력해 주세요.",
    );
  });

  it("선택 텍스트는 빈 문자열·공백·undefined를 null로 바꾼다", () => {
    const schema = optionalText("설명", 10);
    expect(schema.parse("")).toBeNull();
    expect(schema.parse("   ")).toBeNull();
    expect(schema.parse(undefined)).toBeNull();
    expect(schema.parse(" 안녕 ")).toBe("안녕");
  });
});

describe("숫자", () => {
  it("양의 정수는 숫자 문자열을 받고 범위를 검사한다", () => {
    const schema = positiveIntSchema("좌석 수", 10);
    expect(schema.parse("3")).toBe(3);
    expect(firstMessage(schema.safeParse("0"))).toBe(
      "좌석 수는 1 이상이어야 해요.",
    );
    expect(firstMessage(schema.safeParse("11"))).toBe(
      "좌석 수는 10 이하로 입력해 주세요.",
    );
  });

  it("선택 양의 정수는 비우면 null(제한 없음)이다", () => {
    expect(optionalPositiveIntSchema("정원", 1000).parse("")).toBeNull();
  });

  it("금액은 원 단위 정수만, 1천만 원 이하만 받는다", () => {
    const schema = wonAmountSchema("금액");
    expect(schema.parse("-9000")).toBe(-9000);
    expect(firstMessage(schema.safeParse("1.5"))).toBe(
      "금액은 원 단위 정수로 입력해 주세요.",
    );
    expect(firstMessage(schema.safeParse("10000001"))).toBe(
      "금액은 1천만 원 이하로 입력해 주세요.",
    );
  });
});

describe("체크박스", () => {
  it("'on'·'true'·true만 true, 나머지는 false다", () => {
    expect(checkboxSchema.parse("on")).toBe(true);
    expect(checkboxSchema.parse("true")).toBe(true);
    expect(checkboxSchema.parse(true)).toBe(true);
    expect(checkboxSchema.parse(undefined)).toBe(false);
  });
});

describe("일시", () => {
  const schema = dateTimeSchema("일시");

  it("오프셋 없는 datetime-local 값은 초를 채우고 KST 오프셋을 붙인다", () => {
    expect(schema.parse("2026-10-18T09:00")).toBe("2026-10-18T09:00:00+09:00");
  });

  it("오프셋이 있는 값은 그대로 둔다", () => {
    expect(schema.parse("2026-10-18T00:00:00.000Z")).toBe(
      "2026-10-18T00:00:00.000Z",
    );
  });

  it("비었거나 형식이 틀리면 거부한다", () => {
    expect(firstMessage(schema.safeParse(""))).toBe("일시를 입력해 주세요.");
    expect(firstMessage(schema.safeParse("내일 아침"))).toBe(
      "일시 형식이 올바르지 않아요.",
    );
  });
});
