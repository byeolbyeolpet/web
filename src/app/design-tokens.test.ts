// globals.css 토큰 계약 — 마커 색 동기·칩 대비를 값 수준에서 검증한다.
//
// 이 검사가 entities 가 아니라 app 계층에 있는 이유: globals.css 는 app 의 자산이고,
// entities 에서 읽으면 entities → app 역방향 의존이 된다(FSD 단방향, CodeRabbit 지적).
// 여기서 entities 의 상수를 가져다 쓰는 방향은 정방향이라 문제없다.
// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PLACE_CATEGORY } from "@/entities/place";

const css = readFileSync(
  resolve(process.cwd(), "src/app/globals.css"),
  "utf-8",
);

/** 카테고리 코드 → CSS 토큰 이름 (DB enum 과 토큰 이름이 하나만 다르다) */
const tokenName = (code: string) =>
  code === "animal_hospital" ? "hospital" : code;

/** 한 테마 블록만 잘라낸다 — 라이트(:root)와 다크(.dark)의 같은 이름 토큰 구분용 */
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

/** `bg-place-*\/10` 이 실제로 그려지는 색 — 면색 10% 를 배경 위에 합성한 값 */
const tint = (surface: string, base: string) =>
  rgb(base).map((c, i) => c * 0.1 + rgb(surface)[i] * 0.9);

describe("place 카테고리 토큰", () => {
  it("마커 색이 라이트 토큰과 일치한다 — SVG 는 CSS 변수를 못 읽는다", () => {
    const light = themeOf(":root");
    for (const [code, entry] of Object.entries(PLACE_CATEGORY)) {
      expect(tokenOf(light, `--place-${tokenName(code)}`)).toBe(
        entry.markerColor,
      );
    }
  });

  // 이 검사가 없으면 axe 가 잡아 주기를 기대해야 하는데, e2e 는 장소 한 건만
  // 열어 보므로 그때 뽑힌 업종만 검사된다(실제로 CI 가 5업종 중 하나만 잡았다).
  it("칩 글자가 자기 tint 면 위에서 AA(4.5:1)를 지킨다 — 라이트·다크 모두", () => {
    for (const selector of [":root", ".dark"]) {
      const block = themeOf(selector);
      const background = tokenOf(block, "--background");
      for (const code of Object.keys(PLACE_CATEGORY)) {
        const name = tokenName(code);
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

  it("상태 배지 글자가 배경 위에서 AA 를 지킨다 — 면색은 미달이라 emphasis 를 쓴다", () => {
    for (const selector of [":root", ".dark"]) {
      const block = themeOf(selector);
      const background = rgb(tokenOf(block, "--background"));
      for (const name of ["success", "warning"]) {
        const ratio = contrast(
          rgb(tokenOf(block, `--${name}-emphasis`)),
          background,
        );
        expect(ratio, `${selector} --${name}-emphasis`).toBeGreaterThan(4.5);
      }
    }
  });
});
