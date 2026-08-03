// 물방울 핀 SVG 생성 — 색·글리프 삽입, 선택 확대
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PIN_SIZE, placePinDataUrl } from "./marker-svg";

describe("placePinDataUrl", () => {
  it("data URI 로 색과 글리프가 들어간 SVG 를 만든다", () => {
    const url = placePinDataUrl({ color: "#e5484d", glyph: "병" });
    expect(url.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    const svg = decodeURIComponent(url.split(",")[1]!);
    expect(svg).toContain("#e5484d");
    expect(svg).toContain("병");
  });

  it("선택 핀은 기본보다 크다", () => {
    expect(PIN_SIZE.selected.width).toBeGreaterThan(PIN_SIZE.base.width);
    expect(PIN_SIZE.selected.height).toBeGreaterThan(PIN_SIZE.base.height);
  });
});
