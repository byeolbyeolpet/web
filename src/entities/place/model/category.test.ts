// 카테고리 상수 무결성 — 5업종 완비 + 칩 클래스 규약.
// globals.css 토큰과의 값 대조는 app 계층(src/app/design-tokens.test.ts)이 맡는다 —
// 여기서 읽으면 entities → app 역방향 의존이 된다.
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

  it("칩 클래스가 글자에 emphasis 토큰을 쓴다 — 면색을 글자로 쓰면 대비가 깨진다", () => {
    for (const [code, entry] of Object.entries(PLACE_CATEGORY)) {
      const name = code === "animal_hospital" ? "hospital" : code;
      expect(entry.chipClass).toContain(`text-place-${name}-emphasis`);
      expect(entry.chipClass).toContain(`bg-place-${name}/10`);
    }
  });
});
