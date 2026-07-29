// 로그인 상태에서 콘솔이 조용한지 본다.
//
// 지호님이 마이 화면에서 "Message: {}" 만 찍히는 오류를 봤는데, 그때는 E2E 가
// 세션을 못 만들어 재현하지 못했다. 세션이 생겼으니 이제 기계가 지켜본다.
//
// 콘솔 에러는 "화면은 나오는데 뭔가 실패한" 상태의 유일한 신호다. 렌더만 보는
// 테스트는 이걸 통째로 놓친다.

import { expect, test, type ConsoleMessage } from "@playwright/test";
import { SKIP_WITHOUT_ACCOUNT } from "../auth-config";

test.skip(SKIP_WITHOUT_ACCOUNT.condition, SKIP_WITHOUT_ACCOUNT.reason);

const SCREENS = [
  { path: "/me", name: "마이" },
  { path: "/pet/new", name: "펫 등록" },
];

for (const { path, name } of SCREENS) {
  test(`${name} 화면에서 콘솔 에러가 없다`, async ({ page }) => {
    const errors: string[] = [];

    const record = (msg: ConsoleMessage) => {
      if (msg.type() !== "error") return;
      // 인자를 전부 펼쳐서 남긴다. Error 상속 클래스는 message·name 이
      // non-enumerable 이라 객체만 찍으면 "{}" 가 되어 원인을 못 짚는다.
      errors.push(msg.text());
    };

    page.on("console", record);
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

    await page.goto(path);
    await page.getByRole("navigation").or(page.getByRole("main")).first();
    // 초기 쿼리들이 끝날 시간을 준다 — 에러는 대개 응답이 온 뒤에 난다.
    await page.waitForLoadState("networkidle");

    expect(errors).toEqual([]);
  });
}
