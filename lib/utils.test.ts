import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("여러 클래스를 공백으로 합친다", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("Tailwind 클래스가 충돌하면 뒤에 온 클래스를 남긴다", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm text-red-500", "text-blue-500")).toBe(
      "text-sm text-blue-500",
    );
  });

  it("falsy 값과 조건부 객체를 처리한다", () => {
    expect(
      cn("base", false, null, undefined, "", { active: true, hidden: false }),
    ).toBe("base active");
  });
});
