import { describe, expect, it } from "vitest";
import { MOCK_GROUP_IDS } from "@/lib/mocks/ids";
import { fieldErrorsOf } from "@/lib/test-utils/zod";
import { createEventInputSchema } from "@/lib/validations/event";

const validInput = {
  groupId: MOCK_GROUP_IDS.climbing,
  clonedFromEventId: "",
  title: "10월 정기 산행",
  description: "",
  location: "북한산",
  startAt: "2026-10-18T09:00",
  rsvpDeadline: "2026-10-15T23:00",
  capacity: "3",
};

describe("createEventInputSchema", () => {
  it("정상 입력을 DTO로 바꾼다(빈 값 → null, 숫자 문자열 → 숫자, KST 부착)", () => {
    expect(createEventInputSchema.parse(validInput)).toEqual({
      groupId: MOCK_GROUP_IDS.climbing,
      clonedFromEventId: null,
      title: "10월 정기 산행",
      description: null,
      location: "북한산",
      startAt: "2026-10-18T09:00:00+09:00",
      rsvpDeadline: "2026-10-15T23:00:00+09:00",
      capacity: 3,
    });
  });

  it("정원과 응답 마감을 비우면 null이다", () => {
    const parsed = createEventInputSchema.parse({
      ...validInput,
      capacity: "",
      rsvpDeadline: "",
    });
    expect(parsed.capacity).toBeNull();
    expect(parsed.rsvpDeadline).toBeNull();
  });

  it("응답 마감이 시작보다 늦으면 rsvpDeadline 필드에 에러를 준다", () => {
    expect(
      fieldErrorsOf(createEventInputSchema, {
        ...validInput,
        rsvpDeadline: "2026-10-18T10:00",
      }),
    ).toEqual({ rsvpDeadline: "응답 마감은 이벤트 일시보다 늦을 수 없어요." });
  });

  it("시간대가 달라도 실제 시각으로 비교한다(00:30Z = 09:30 KST)", () => {
    expect(
      fieldErrorsOf(createEventInputSchema, {
        ...validInput,
        rsvpDeadline: "2026-10-18T00:30:00.000Z",
      }),
    ).toHaveProperty("rsvpDeadline");
  });

  it("정원이 0이면 거부한다", () => {
    expect(
      fieldErrorsOf(createEventInputSchema, { ...validInput, capacity: "0" }),
    ).toEqual({
      capacity: "정원은 1 이상이어야 해요.",
    });
  });
});
