import { describe, expect, it } from "vitest";
import { MOCK_EVENT_IDS } from "@/lib/mocks/ids";
import { fieldErrorsOf } from "@/lib/test-utils/zod";
import { respondRsvpInputSchema } from "@/lib/validations/rsvp";

const eventId = MOCK_EVENT_IDS.overCapacity;

describe("respondRsvpInputSchema", () => {
  it.each(["going", "not_going", "maybe"])("%s 응답은 통과한다", (status) => {
    expect(respondRsvpInputSchema.parse({ eventId, status }).status).toBe(
      status,
    );
  });

  it("waitlisted는 서버만 정하므로 직접 입력을 거부한다", () => {
    expect(
      fieldErrorsOf(respondRsvpInputSchema, { eventId, status: "waitlisted" }),
    ).toEqual({
      status: "참석, 불참, 미정 중에서 골라 주세요.",
    });
  });
});
