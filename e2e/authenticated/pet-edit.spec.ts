// 펫 수정·삭제 전 구간 — 로그인 상태에서만 볼 수 있는 것.
//
// 유닛은 폼과 mutation 이 이어지는지까지만 본다. 여기서만 확인되는 것은
// **실제로 DB 가 바뀌고 목록에 반영되는가** 다 — RLS(pets_update_own /
// pets_delete_own)·쿼리 무효화·화면 전환이 한 줄로 이어지는 지점이다.
//
// 경로가 /pet/edit?id=... 인 것도 여기서 검증된다. Static Export 는 빌드 시점에
// 없던 id 를 404 로 내므로 동적 세그먼트를 못 쓴다(ADR-0002).

import { expect, test, type Page } from "@playwright/test";
import { SKIP_WITHOUT_ACCOUNT } from "../auth-config";

test.skip(SKIP_WITHOUT_ACCOUNT.condition, SKIP_WITHOUT_ACCOUNT.reason);

function uniqueName(prefix = "E2E") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** 이 테스트가 만지고 지울 펫을 하나 만든다. 남의 데이터를 건드리지 않기 위해서다. */
async function createPet(page: Page, name: string, species = "고양이") {
  await page.goto("/pet/new");
  await expect(page.getByRole("radio", { name: "강아지" })).toBeVisible();

  await page.getByRole("radio", { name: species }).click();
  await page.getByLabel("이름").fill(name);
  await page.getByRole("button", { name: "등록하기" }).click();
  await expect(page).toHaveURL(/\/me\/?$/);
  await expect(page.getByText(name)).toBeVisible();
}

/** 마이 목록에서 그 펫의 행을 눌러 수정 화면으로 간다. */
async function openEdit(page: Page, name: string) {
  await page.getByRole("link", { name: `${name} 정보 수정` }).click();
  await expect(page).toHaveURL(/\/pet\/edit\/?\?id=/);
  await expect(page.getByLabel("이름")).toHaveValue(name);
}

test("목록에서 행을 눌러 수정 화면으로 간다", async ({ page }) => {
  const name = uniqueName();
  await createPet(page, name);

  await openEdit(page, name);

  // 값이 있는 채로 열리므로 종 그리드는 접힌 상태로 시작한다(SpeciesPicker).
  // 접힘 카드가 등록 때 고른 종을 그대로 들고 있어야 한다.
  await expect(
    page.getByRole("button", { name: /선택한 종류 고양이/ }),
  ).toBeVisible();
});

test("이름을 고치면 목록에 반영된다", async ({ page }) => {
  const name = uniqueName();
  const renamed = uniqueName("수정됨");
  await createPet(page, name);
  await openEdit(page, name);

  await page.getByLabel("이름").fill(renamed);
  await page.getByRole("button", { name: "저장하기" }).click();

  await expect(page).toHaveURL(/\/me\/?$/);
  await expect(page.getByText(renamed)).toBeVisible();
  await expect(page.getByText(name)).toHaveCount(0);
});

test("종을 바꾸면 목록의 종 태그가 바뀐다", async ({ page }) => {
  const name = uniqueName();
  await createPet(page, name, "고양이");
  await openEdit(page, name);

  // collapsible 이라 이미 고른 종이 접혀 있다 — 접힘 카드를 눌러 펼친다.
  await page.getByRole("button", { name: /선택한 종류 고양이/ }).click();
  await page.getByRole("radio", { name: "페럿" }).click();
  await page.getByRole("button", { name: "저장하기" }).click();

  await expect(page).toHaveURL(/\/me\/?$/);
  await expect(
    page.getByRole("listitem").filter({ hasText: name }),
  ).toContainText("페럿");
});

test("삭제는 확인을 거쳐야 하고, 취소하면 남아 있다", async ({ page }) => {
  const name = uniqueName();
  await createPet(page, name);
  await openEdit(page, name);

  await page.getByRole("button", { name: /삭제하기/ }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "취소" }).click();
  await expect(dialog).toBeHidden();
  // 취소했으니 여전히 수정 화면이고 펫도 그대로다.
  await expect(page).toHaveURL(/\/pet\/edit\/?\?id=/);

  await page.goto("/me");
  await expect(page.getByText(name)).toBeVisible();
});

test("확인하면 삭제되고 목록에서 사라진다", async ({ page }) => {
  const name = uniqueName();
  await createPet(page, name);
  await openEdit(page, name);

  await page.getByRole("button", { name: /삭제하기/ }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "삭제" })
    .click();

  await expect(page).toHaveURL(/\/me\/?$/);
  await expect(page.getByText(name)).toHaveCount(0);
});

test("없는 id 로 들어가면 없다고 알리고 길을 준다", async ({ page }) => {
  // 빌드 시점에 없던 경로라도 404 가 아니라 정적 페이지 한 장이 뜨는지까지 본다.
  const response = await page.goto(
    "/pet/edit/?id=00000000-0000-0000-0000-000000000000",
  );

  expect(response?.status()).toBe(200);
  await expect(page.getByText("찾을 수 없는 반려동물이에요.")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "내 반려동물 보기" }),
  ).toBeVisible();
});
