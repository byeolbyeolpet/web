// cn() 유틸의 클래스 병합·충돌 정리 동작을 검증한다.
import { describe, it, expect } from "vitest";
import { cn } from "@/shared/lib/utils";

describe("cn", () => {
  it("여러 클래스를 공백으로 합친다", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("충돌하는 Tailwind 유틸리티는 뒤엣것이 이긴다", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("falsy 값은 무시한다", () => {
    expect(cn("px-2", false, null, undefined, "py-1")).toBe("px-2 py-1");
  });
});
