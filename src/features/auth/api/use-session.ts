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
        // 맥락 문자열을 먼저 넘긴다. 에러 객체만 넘기면 Error 상속 클래스의
        // message·name 이 non-enumerable 이라 dev 오버레이에 "{}" 로만 찍혀
        // 어디서 났는지 알 수 없다.
        console.error("[auth] getSession 실패", error);
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
