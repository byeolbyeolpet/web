// 로그인 화면들의 접근성 — 앞서 자체 평가에서 구멍이라고 적었던 자리다.
//
// jsdom axe 는 라벨·역할·aria 관계까지만 본다. 레이아웃 엔진이 없어 **대비와
// 터치 영역은 판정되지 않는다.** 그런데 등록 폼과 마이는 로그인이 필요해
// guest E2E 가 닿지 못했다. 세션이 생긴 지금 그 둘을 실제 브라우저에서 본다.
//
// wcag22aa 를 넣은 이유는 우리 규칙인 최소 탭 영역 44px(CLAUDE.md)를
// target-size 로 기계 검증하기 위해서다. 종 선택 14칸이 3열로 놓이는 화면이라
// 여기가 가장 좁아질 수 있는 지점이다.

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { SKIP_WITHOUT_ACCOUNT } from "../auth-config";

test.skip(SKIP_WITHOUT_ACCOUNT.condition, SKIP_WITHOUT_ACCOUNT.reason);

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function scan(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();

  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    targets: v.nodes.map((n) => n.target.join(" ")),
  }));
}

test("등록 폼에 WCAG A·AA 위반이 없다", async ({ page }) => {
  await page.goto("/pet/new");
  await expect(page.getByRole("radiogroup", { name: "종류" })).toBeVisible();

  expect(await scan(page)).toEqual([]);
});

test("등록 폼은 오류가 표시된 상태에서도 위반이 없다", async ({ page }) => {
  // 오류 표시가 aria-invalid·aria-describedby·role=alert 를 한꺼번에 건드린다.
  await page.goto("/pet/new");
  await expect(page.getByRole("radiogroup", { name: "종류" })).toBeVisible();
  await page.getByRole("button", { name: "등록하기" }).click();
  await expect(page.getByText("이름을 입력해 주세요.")).toBeVisible();

  expect(await scan(page)).toEqual([]);
});

test("마이 화면에 WCAG A·AA 위반이 없다", async ({ page }) => {
  await page.goto("/me");
  await expect(
    page.getByRole("heading", { name: "나의 반려동물" }),
  ).toBeVisible();

  expect(await scan(page)).toEqual([]);
});

test("마이 화면은 다크 모드에서도 대비 위반이 없다", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/me");
  await expect(
    page.getByRole("heading", { name: "나의 반려동물" }),
  ).toBeVisible();

  const { violations } = await new AxeBuilder({ page })
    .withRules(["color-contrast"])
    .analyze();

  expect(
    violations.flatMap((v) => v.nodes.map((n) => n.failureSummary)),
  ).toEqual([]);
});
