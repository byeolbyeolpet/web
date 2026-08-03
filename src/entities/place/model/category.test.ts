// 카테고리 상수 무결성 — 5업종 완비 + globals.css 토큰과 마커 색 동기 검증
// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { Constants } from "@/shared/lib/supabase/database.types";
import { PLACE_CATEGORY, PLACE_CATEGORY_LIST } from "./category";

describe("PLACE_CATEGORY", () => {
  it("DB enum 5업종 전부에 라벨·마커색·글리프·아이콘·칩 클래스가 있다", () => {
    for (const code of Constants.public.Enums.place_category) {
      const entry = PLACE_CATEGORY[code];
      expect(entry.label).toBeTruthy();
      expect(entry.markerColor).toMatch(/^#[0-9a-f]{6}$/);
      expect(entry.glyph).toHaveLength(1);
      expect(entry.Icon).toBeTypeOf("function");
      expect(entry.chipClass).toContain("text-place-");
    }
    expect(PLACE_CATEGORY_LIST.map((c) => c.code)).toEqual([
      ...Constants.public.Enums.place_category,
    ]);
  });

  it("마커 색이 globals.css 라이트 토큰과 일치한다 — SVG 는 CSS 변수를 못 읽는다", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/app/globals.css"),
      "utf-8",
    );
    for (const [code, entry] of Object.entries(PLACE_CATEGORY)) {
      const token = code === "animal_hospital" ? "hospital" : code;
      const match = css.match(
        new RegExp(`--place-${token}:\\s*(#[0-9a-f]{6})`),
      );
      expect(match?.[1], `--place-${token} 토큰 누락`).toBe(entry.markerColor);
    }
  });
});
