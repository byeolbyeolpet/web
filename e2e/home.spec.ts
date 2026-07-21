// 홈 화면이 로드되어 브랜드명이 보이는지 확인하는 스모크 E2E.
import { test, expect } from "@playwright/test";

test("홈이 로드되고 별별펫이 보인다", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "별별펫", level: 1 }),
  ).toBeVisible();
});
