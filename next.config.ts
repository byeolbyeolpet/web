import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Static Export ─────────────────────────────────────────
  // 최종 타깃이 Capacitor WebView 앱이라 정적 번들이 필수다.
  // `next build` → `out/` 에 라우트별 HTML/CSS/JS를 생성한다.
  // 이 설정을 켠 이상 서버 기능(Server Actions, 요청 기반 Route
  // Handler, cookies, proxy, redirects, ISR)은 쓸 수 없다.
  // 서버가 필요한 것(Gemini 호출 등)은 Supabase Edge Functions로 간다.
  output: "export",

  // 정적 export에서는 기본 이미지 최적화(서버 요구)를 못 쓴다.
  // 이미지 서빙 방식이 확정될 때까지 최적화를 끈다.
  // 추후 Supabase Storage + custom loader로 전환 가능.
  images: {
    unoptimized: true,
  },

  // `/place` → `/place/` 로 정규화하고 `place/index.html` 로 emit.
  // 정적 호스팅에서 경로 매칭이 안정적이다.
  trailingSlash: true,

  // React Compiler — 수동 useMemo/useCallback을 남발하지 않는다.
  reactCompiler: true,
};

export default nextConfig;
