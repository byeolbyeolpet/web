namespace NodeJS {
  interface ProcessEnv {
    // PRIVATE
    SUPABASE_DATABASE_PASSWORD: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    // PUBLIC
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
    NEXT_PUBLIC_KAKAO_MAP_KEY: string;

    // Google OAuth — 웹 애플리케이션 클라이언트 ID (공개 값, 네이티브 serverClientId 겸용)
    // 클라이언트 비번은 여기 두지 않는다 — Supabase 대시보드(Auth > Providers > Google)에만.
    NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID: string;

    // TEST
    E2E_USER_EMAIL: string;
    E2E_USER_PASSWORD: string;
  }
}
