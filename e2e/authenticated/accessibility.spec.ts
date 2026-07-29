// 로그인 화면들의 접근성 — 앞서 자체 평가에서 구멍이라고 적었던 자리다.
//
// jsdom axe 는 라벨·역할·aria 관계까지만 본다. 레이아웃 엔진이 없어 **대비와
// 터치 영역은 판정되지 않는다.** 그런데 등록 폼과 마이는 로그인이 필요해
// guest E2E 가 닿지 못했다. 세션이 생긴 지금 그 둘을 실제 브라우저에서 본다.

import { expect, test } from "@playwright/test";
import { SKIP_WITHOUT_ACCOUNT } from "../auth-config";
import { scanContrast, scanWcag } from "../a11y";

test.skip(SKIP_WITHOUT_ACCOUNT.condition, SKIP_WITHOUT_ACCOUNT.reason);

// 준비 신호를 radiogroup 컨테이너로 잡으면 안 된다. 종 목록이 도착하기 전에는
// 칸이 하나도 없는 빈 그리드라 높이가 0 이고, Playwright 는 그것을 hidden 으로
// 본다. 실제 선택지 하나가 보이는 것을 기준으로 삼는다.
const speciesReady = "강아지";

test("등록 폼에 WCAG A·AA 위반이 없다", async ({ page }) => {
  await page.goto("/pet/new");
  await expect(page.getByRole("radio", { name: speciesReady })).toBeVisible();

  expect(await scanWcag(page)).toEqual([]);
});

test("등록 폼은 오류가 표시된 상태에서도 위반이 없다", async ({ page }) => {
  // 오류 표시가 aria-invalid·aria-describedby·role=alert 를 한꺼번에 건드린다.
  await page.goto("/pet/new");
  await expect(page.getByRole("radio", { name: speciesReady })).toBeVisible();
  await page.getByRole("button", { name: "등록하기" }).click();
  await expect(page.getByText("이름을 입력해 주세요.")).toBeVisible();

  expect(await scanWcag(page)).toEqual([]);
});

test("마이 화면에 WCAG A·AA 위반이 없다", async ({ page }) => {
  await page.goto("/me");
  // 제목은 펫 목록이 스켈레톤일 때 이미 보인다. 실제 검사 대상인 목록 항목이
  // 붙는 것을 기준으로 삼아야 스켈레톤을 검사하고 통과하는 일이 없다.
  await page.getByRole("listitem").first().waitFor();

  expect(await scanWcag(page)).toEqual([]);
});

test("마이 화면은 다크 모드에서도 대비 위반이 없다", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/me");
  // 제목은 펫 목록이 스켈레톤일 때 이미 보인다. 실제 검사 대상인 목록 항목이
  // 붙는 것을 기준으로 삼아야 스켈레톤을 검사하고 통과하는 일이 없다.
  await page.getByRole("listitem").first().waitFor();

  expect(await scanContrast(page)).toEqual([]);
});
