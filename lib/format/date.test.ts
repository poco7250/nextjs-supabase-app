import { describe, expect, it } from "vitest";
import { formatDate, formatEventDateTime } from "@/lib/format/date";

describe("formatEventDateTime", () => {
  it("UTC 시각을 KST로 바꿔 요일과 오전/오후를 붙인다", () => {
    expect(formatEventDateTime("2026-10-17T23:00:00.000Z")).toBe(
      "10월 18일 (일) 오전 8:00",
    );
    expect(formatEventDateTime("2026-10-10T10:00:00.000Z")).toBe(
      "10월 10일 (토) 오후 7:00",
    );
  });

  it("오프셋이 붙은 값도 같은 시각으로 표시한다", () => {
    expect(formatEventDateTime("2026-10-18T08:00:00+09:00")).toBe(
      "10월 18일 (일) 오전 8:00",
    );
  });
});

describe("formatDate", () => {
  it("KST 기준 날짜를 연·월·일로 표시한다(UTC 자정 전후 경계)", () => {
    expect(formatDate("2026-05-31T16:00:00.000Z")).toBe("2026년 6월 1일");
    expect(formatDate("2026-05-31T14:59:59.000Z")).toBe("2026년 5월 31일");
  });
});
