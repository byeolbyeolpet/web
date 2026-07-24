// 브라우저 전용 Supabase 클라이언트. Static Export 라 서버 client 는 존재하지 않는다 (ADR-0004).
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { Preferences } from "@capacitor/preferences";
import type { Database } from "./database.types";

/*
 * 세션은 네이티브 저장소(iOS UserDefaults / Android SharedPreferences)에 둔다.
 * WebView 저장소(쿠키·localStorage)는 OS 저장공간 청소·iOS ITP 리스크가 있고,
 * 네이티브 저장소만 둘 다 회피한다 — 근거와 실측은 ADR-0004.
 * 웹(브라우저)에서는 Preferences 가 localStorage 로 폴백되므로 같은 코드가 돈다.
 */
const preferencesStorage = {
  getItem: async (key: string) => (await Preferences.get({ key })).value,
  setItem: async (key: string, value: string) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string) => {
    await Preferences.remove({ key });
  },
};

// GoTrueClient 를 여러 개 만들면 세션 갱신이 경합한다. 모듈 싱글턴으로 하나만 유지한다.
let client: SupabaseClient<Database> | undefined;

export function createClient() {
  client ??= createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        storage: preferencesStorage,
        // 웹(개발용) OAuth 폴백은 PKCE 로 — 코드가 URL 에 노출돼도 verifier 없이는
        // 세션 교환이 불가하다. 교환은 /auth/callback 클라이언트 페이지가 한다.
        // 네이티브 경로(signInWithIdToken)는 flowType 의 영향을 받지 않는다.
        flowType: "pkce",
      },
    },
  );
  return client;
}
