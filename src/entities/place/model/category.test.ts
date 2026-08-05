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

  // 칩 글자는 면색이 아니라 emphasis 다. 이 검사가 없으면 axe 가 잡아 주기를
  // 기대해야 하는데, e2e 는 장소 한 건만 열어 보므로 그때 뽑힌 업종만 검사된다
  // (실제로 CI 가 5업종 중 하나만 잡았다). 5×2 테마를 여기서 결정적으로 막는다.
  it("칩 글자가 자기 tint 면 위에서 AA(4.5:1)를 지킨다 — 라이트·다크 모두", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/app/globals.css"),
      "utf-8",
    );
    const themeOf = (selector: string) => {
      const start = css.indexOf(`${selector} {`);
      return css.slice(start, css.indexOf("\n}", start));
    };
    const tokenOf = (block: string, name: string) => {
      const value = block.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`))?.[1];
      expect(value, `${name} 토큰 누락`).toBeDefined();
      return value!;
    };

    const rgb = (hex: string) =>
      [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const luminance = (channels: number[]) => {
      const [r, g, b] = channels.map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contrast = (fg: number[], bg: number[]) => {
      const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
      return (hi + 0.05) / (lo + 0.05);
    };
    /** bg-place-*\/10 이 실제로 그려지는 색 — 면색 10% 를 배경 위에 합성한 값 */
    const tint = (surface: string, base: string) =>
      rgb(base).map((c, i) => c * 0.1 + rgb(surface)[i] * 0.9);

    for (const selector of [":root", ".dark"]) {
      const block = themeOf(selector);
      const background = tokenOf(block, "--background");
      for (const code of Object.keys(PLACE_CATEGORY)) {
        const name = code === "animal_hospital" ? "hospital" : code;
        const ratio = contrast(
          rgb(tokenOf(block, `--place-${name}-emphasis`)),
          tint(background, tokenOf(block, `--place-${name}`)),
        );
        expect(ratio, `${selector} --place-${name}-emphasis`).toBeGreaterThan(
          4.5,
        );
      }
    }
  });

  it("칩 클래스가 글자에 emphasis 토큰을 쓴다 — 면색을 글자로 쓰면 대비가 깨진다", () => {
    for (const [code, entry] of Object.entries(PLACE_CATEGORY)) {
      const name = code === "animal_hospital" ? "hospital" : code;
      expect(entry.chipClass).toContain(`text-place-${name}-emphasis`);
      expect(entry.chipClass).toContain(`bg-place-${name}/10`);
    }
  });
});
