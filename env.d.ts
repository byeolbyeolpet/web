namespace NodeJS {
  interface ProcessEnv {
    // PRIVATE
    SUPABASE_DATABASE_PASSWORD: string;

    // PUBLIC
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
  }
}
