// 펫 등록 경로의 E2E — 빌드된 out/ 을 정적 서빙한 실제 산출물로 검증한다.
//
// **로그인이 필요한 화면의 내부 동작은 여기서 다루지 않는다.** 우리 인증은
// Google OAuth 뿐이라 E2E 에서 세션을 만들 수단이 없다(이메일/비밀번호 로그인이
// 없다). 세션 주입은 실제 토큰을 CI 에 넣어야 하고 토큰은 만료된다.
// 그래서 여기서는 **로그인 없이 확인 가능한 것**만 본다:
//   - 클라이언트 세션 가드가 실제로 막는가 (ADR-0004 의 핵심 방어선)
//   - Static Export 가 해당 경로를 실제로 내보냈는가
// 폼 내부 동작(검증·접기·제출)은 유닛 테스트가 덮는다.
//
// 후속: 테스트 계정 + storageState 로 인증 E2E 를 붙인다.

import { expect, test } from "@playwright/test";

const GUARDED_PATHS = ["/pet/new", "/me"];

for (const path of GUARDED_PATHS) {
  test(`비로그인으로 ${path} 에 들어가면 로그인 화면으로 보낸다`, async ({
    page,
  }) => {
    await page.goto(path);

    // 클라 가드는 마운트 후 리다이렉트한다 — 화면 전환을 기다린다.
    await expect(
      page.getByRole("button", { name: "Google로 계속하기" }),
    ).toBeVisible();
    await expect(page).not.toHaveURL(new RegExp(`${path}/?$`));
  });
}

test("펫 등록 경로가 정적 산출물로 존재한다", async ({ page }) => {
  // Static Export 라 라우트가 빌드 시점에 out/pet/new/index.html 로 나와야 한다.
  // 404 면 next.config 의 output:'export' 경로 설정이 깨진 것이다.
  const response = await page.goto("/pet/new");

  expect(response?.status()).toBe(200);
});

test("로그인 화면은 게스트 열람 경로를 함께 제공한다", async ({ page }) => {
  // 로그인 강요는 이 앱의 정체성이 아니다(정보 허브 + 게스트 열람).
  await page.goto("/pet/new");

  await expect(
    page.getByRole("link", { name: "로그인 없이 둘러보기" }),
  ).toBeVisible();
});
