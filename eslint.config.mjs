import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Capacitor 네이티브 프로젝트 — assets/public 은 out/ 을 복사한 빌드 산출물이다.
    "android/**",
    "ios/**",
    // Supabase 자동 생성 타입 — 생성기 스타일 유지, 린트 예외.
    "src/shared/lib/supabase/database.types.ts",
  ]),
]);

export default eslintConfig;
