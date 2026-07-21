// Playwright E2E 설정 — 빌드된 Static Export(out/)를 정적 서빙해 모바일 뷰포트로 테스트한다.
import { defineConfig, devices } from "@playwright/test";

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
  projects: [{ name: "mobile-chrome", use: { ...devices["Pixel 5"] } }],
  // 실제 배포되는 산출물(out/)을 그대로 띄운다. dev 서버가 아니다.
  webServer: {
    command: "npm run build && npx http-server out -p 3000 -s",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
