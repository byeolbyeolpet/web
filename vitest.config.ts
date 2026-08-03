// Vitest 설정 — jsdom 환경 + React Testing Library, @/ 경로 별칭, jest-dom 매처.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    // 단위/컴포넌트 테스트만. E2E(e2e/*.spec.ts)는 Playwright가 맡는다.
    // scripts/ 는 수집 파이프라인 단위 테스트 — 파일 상단 @vitest-environment node 로 돈다.
    include: ["src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.{test,spec}.ts"],
  },
});
