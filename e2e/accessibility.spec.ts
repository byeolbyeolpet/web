// 접근성 자동 검사 (axe-core) — 실제 브라우저에서만 볼 수 있는 것을 본다.
//
// **왜 E2E 인가.** 대비(contrast)·터치 영역(target-size)·랜드마크는 레이아웃과
// 계산된 색이 있어야 판정된다. jsdom 에는 레이아웃 엔진이 없어 이 규칙들이
// violation 이 아니라 incomplete 로 빠진다. 그래서 이 층은 브라우저가 맡고,
// 로그인이 필요해 여기 닿지 못하는 화면(등록 폼·마이)은 유닛 층의 axe 가 맡는다.
//
// **한계를 분명히 한다.** axe 는 자동 판정 가능한 위반만 잡는다. 초점 순서가
// 말이 되는지, 대체 텍스트가 실제로 그림을 설명하는지는 사람이 봐야 한다.
//
// wcag22aa 를 넣은 이유: 우리 규칙이 최소 탭 영역 44×44px 인데(CLAUDE.md),
// 그걸 기계로 확인해 주는 규칙이 2.2 의 target-size 다.

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
] as const;

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

    const { violations } = await new AxeBuilder({ page })
      .withTags([...WCAG_TAGS])
      .analyze();

    // 실패했을 때 규칙 id 만 보이면 어디를 고쳐야 할지 모른다 — 대상까지 남긴다.
    expect(
      violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        targets: v.nodes.map((n) => n.target.join(" ")),
      })),
    ).toEqual([]);
  });
}

test("다크 모드에서도 대비 위반이 없다", async ({ page }) => {
  // 대비는 테마마다 다른 값이다. 라이트에서 통과해도 다크는 별개다 —
  // 실제로 --primary 를 #9b87f5 에서 #7350e0 으로 바꾼 것이 이 문제였다.
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: "Google로 계속하기" }),
  ).toBeVisible();

  // withRules 와 withTags 는 둘 다 runOnly 를 세팅해 나중 호출이 앞을 덮는다.
  // 대비만 보려는 것이므로 withRules 하나만 쓴다.
  const { violations } = await new AxeBuilder({ page })
    .withRules(["color-contrast"])
    .analyze();

  expect(
    violations.flatMap((v) => v.nodes.map((n) => n.failureSummary)),
  ).toEqual([]);
});
