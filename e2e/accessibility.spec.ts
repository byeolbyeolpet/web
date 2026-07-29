// 접근성 자동 검사 (axe-core) — 실제 브라우저에서만 볼 수 있는 것을 본다.
//
// **왜 E2E 인가.** 대비(contrast)·터치 영역(target-size)·랜드마크는 레이아웃과
// 계산된 색이 있어야 판정된다. jsdom 에는 레이아웃 엔진이 없어 이 규칙들이
// violation 이 아니라 incomplete 로 빠진다. 그래서 이 층은 브라우저가 맡고,
// 로그인이 필요해 여기 닿지 못하는 화면(등록 폼·마이)은 유닛 층의 axe 가 맡는다.
//
// **한계를 분명히 한다.** axe 는 자동 판정 가능한 위반만 잡는다. 초점 순서가
// 말이 되는지, 대체 텍스트가 실제로 그림을 설명하는지는 사람이 봐야 한다.

import { expect, test, type Page } from "@playwright/test";
import { scanContrast, scanWcag } from "./a11y";

/**
 * 세션 없이 실제 내용이 그려지는 화면만 넣는다. 나머지는 아직 placeholder 다.
 * `ready` 는 클라 렌더가 끝난 시점을 잡는 기준 — 이게 없으면 빈 셸을 검사하고
 * 위반 0건으로 통과해 버린다.
 */
const PUBLIC_SCREENS = [
  // 탭 셸(헤더 + 하단 탭)이 모든 탭 화면에 공통으로 얹히므로 여기서 함께 검사된다.
  {
    path: "/",
    name: "홈(탭 셸 포함)",
    ready: (page: Page) => page.getByRole("navigation"),
  },
  {
    path: "/login",
    name: "로그인",
    ready: (page: Page) => page.getByRole("button", { name: /google/i }),
  },
];

for (const { path, name, ready } of PUBLIC_SCREENS) {
  test(`${name} 화면에 WCAG A·AA 위반이 없다`, async ({ page }) => {
    await page.goto(path);
    await expect(ready(page)).toBeVisible({ timeout: 10_000 });

    expect(await scanWcag(page)).toEqual([]);
  });
}

/*
 * 대비는 테마마다 다른 값이라 라이트 통과가 다크를 보증하지 않는다.
 * **화면마다 다크를 따로 본다.** 처음에는 /login 만 다크로 봤는데, 로그인
 * 화면에는 탭바가 없어서 활성 탭 라벨의 대비 미달(#7350e0 on #17181b = 3.34:1)을
 * 놓쳤다. 탭 셸이 얹히는 화면을 빼면 크롬 전체가 검사 밖으로 빠진다.
 */
for (const { path, name, ready } of PUBLIC_SCREENS) {
  test(`${name} 화면이 다크 모드에서도 대비를 지킨다`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(path);
    await expect(ready(page)).toBeVisible({ timeout: 10_000 });

    expect(await scanContrast(page)).toEqual([]);
  });
}
