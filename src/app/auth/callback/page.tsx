// 웹(개발용) OAuth 콜백 — PKCE 코드를 세션으로 교환한다. 서버가 없어 클라 페이지로 처리 (#31).
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  // React StrictMode 의 이중 실행에서 코드 교환이 두 번 가면 두 번째가 실패한다.
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;

    // useSearchParams 는 Static Export 에서 Suspense 경계를 요구한다 — window 로 읽는다.
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) {
      router.replace("/login");
      return;
    }

    createClient()
      .auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          console.error("[auth] 코드 교환 실패", error);
          router.replace("/login");
          return;
        }
        router.replace("/");
      });
  }, [router]);

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <p className="text-sm text-muted-foreground">로그인 처리 중…</p>
    </main>
  );
}
