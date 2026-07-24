// 클라이언트 라우트 가드 — 비로그인이면 /login 으로 보낸다 (router.md 7절).
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./use-session";

export function useRequireSession() {
  const { session, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 세션 미확정(isLoading) 동안은 판단하지 않는다 — 자동 로그인 사용자 보호.
    if (!isLoading && !session) router.replace("/login");
  }, [isLoading, session, router]);

  return { session, isLoading };
}
