// 현재 로그인 세션 구독 훅 — Preferences 저장소가 비동기라 초기 로딩 상태를 가진다.
"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/shared/lib/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  // 첫 getSession 이 끝나기 전에는 "비로그인"이 아니라 "미확정"이다.
  // 이 구간을 비로그인으로 취급하면 자동 로그인 사용자가 /login 으로 튕긴다.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        setIsLoading(false);
      })
      // 저장소 어댑터가 실패해도 로딩에 영구히 갇히면 안 된다 — 비로그인으로 확정한다.
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, isLoading };
}
