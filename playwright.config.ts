// Playwright E2E 설정 — 빌드된 Static Export(out/)를 정적 서빙해 모바일 뷰포트로 테스트한다.
import { defineConfig, devices } from "@playwright/test";
import { AUTH_STATE_PATH } from "./e2e/auth-config";

const MOBILE = devices["Pixel 5"];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  // 모바일 우선 앱이므로 모바일 뷰포트로 검증한다.
  projects: [
    // 테스트 계정으로 로그인해 storageState 를 굽는다. authenticated 가 이것에 의존한다.
    { name: "setup", testMatch: /auth\.setup\.ts/, use: { ...MOBILE } },
    // 비로그인 경로 — 가드·정적 산출물·공개 화면 접근성.
    {
      name: "guest",
      use: { ...MOBILE },
      testIgnore: [/auth\.setup\.ts/, /authenticated[\\/]/],
    },
    // 로그인 이후 화면. 세션이 필요해 guest 로는 닿지 못하는 것만 여기 둔다.
    {
      name: "authenticated",
      use: { ...MOBILE, storageState: AUTH_STATE_PATH },
      testMatch: /authenticated[\\/]/,
      dependencies: ["setup"],
    },
  ],
  // 실제 배포되는 산출물(out/)을 그대로 띄운다. dev 서버가 아니다.
  webServer: {
    command: "npm run build && npx http-server out -p 3000 -s",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
