// 펫 등록 전 구간 — 로그인 상태에서만 볼 수 있는 것.
//
// 유닛 테스트는 폼 내부(검증·트림·잠금)를 덮고, guest E2E 는 가드만 본다.
// 여기서만 확인되는 것은 **실제로 DB 에 들어가고 목록에 나타나는가** 다.
// RLS(auth.uid() = owner_id)·조인·쿼리 무효화가 한 줄로 이어지는 지점이다.

import { expect, test } from "@playwright/test";
import { SKIP_WITHOUT_ACCOUNT } from "../auth-config";

test.skip(SKIP_WITHOUT_ACCOUNT.condition, SKIP_WITHOUT_ACCOUNT.reason);

/** 같은 이름이 쌓이면 단언이 흔들린다. 실행마다 고유한 이름을 만든다. */
function uniqueName() {
  return `E2E-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

test("등록하면 마이 화면 목록에 나타난다", async ({ page }) => {
  const name = uniqueName();

  await page.goto("/pet/new");
  // 세션이 안 실리면 로그인 화면으로 튕긴다 — 그때 실패 원인이 분명하도록 먼저 본다.
  // 컨테이너가 아니라 선택지가 보이는 것을 기준으로 삼는다 — 종 목록이 도착하기
  // 전의 빈 그리드는 높이가 0 이라 hidden 으로 잡힌다.
  await expect(page.getByRole("radio", { name: "강아지" })).toBeVisible();

  await page.getByRole("radio", { name: "페럿" }).click();
  await page.getByLabel("이름").fill(name);
  await page.getByRole("radio", { name: "암컷" }).click();
  await page.getByRole("button", { name: "등록하기" }).click();

  // 등록 후에는 마이로 돌아가고, 새 펫이 목록에 얹혀 있어야 한다.
  await expect(page).toHaveURL(/\/me\/?$/);
  await expect(page.getByText(name)).toBeVisible();
  // 종 태그(해자)가 조인으로 함께 와야 한다 — 목록마다 종을 다시 조회하지 않는 구조.
  await expect(
    page.getByRole("listitem").filter({ hasText: name }),
  ).toContainText("페럿");
});

test("이름을 비우면 등록되지 않는다", async ({ page }) => {
  await page.goto("/pet/new");
  // 컨테이너가 아니라 선택지가 보이는 것을 기준으로 삼는다 — 종 목록이 도착하기
  // 전의 빈 그리드는 높이가 0 이라 hidden 으로 잡힌다.
  await expect(page.getByRole("radio", { name: "강아지" })).toBeVisible();

  await page.getByRole("radio", { name: "강아지" }).click();
  await page.getByRole("button", { name: "등록하기" }).click();

  await expect(page.getByText("이름을 입력해 주세요.")).toBeVisible();
  await expect(page).toHaveURL(/\/pet\/new\/?$/);
});

test("등록 중에는 버튼이 잠겨 두 번 눌리지 않는다", async ({ page }) => {
  const name = uniqueName();

  // insert 응답을 붙잡아 "제출 중" 구간을 실제로 만들어 놓고 확인한다.
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/rest/v1/pets*", async (route) => {
    if (route.request().method() === "POST") await held;
    await route.continue();
  });

  await page.goto("/pet/new");
  // 컨테이너가 아니라 선택지가 보이는 것을 기준으로 삼는다 — 종 목록이 도착하기
  // 전의 빈 그리드는 높이가 0 이라 hidden 으로 잡힌다.
  await expect(page.getByRole("radio", { name: "강아지" })).toBeVisible();

  await page.getByRole("radio", { name: "고양이" }).click();
  await page.getByLabel("이름").fill(name);

  const submit = page.getByRole("button", { name: "등록하기" });
  await submit.click();

  await expect(submit).toBeDisabled();
  await expect(submit).toHaveAttribute("aria-busy", "true");

  release();
  await expect(page).toHaveURL(/\/me\/?$/);
});
