// TanStack Query 전역 Provider — 앱 전체가 하나의 쿼리 캐시를 공유하도록 감싼다.
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

const MAX_RETRY = 2;

/**
 * 재시도 여부를 판단한다.
 *
 * 서버가 에러 객체를 돌려줬다는 것은 요청이 거기까지 도달해 거부됐다는 뜻이라
 * (RLS 거부·검증 실패·없는 리소스) 같은 요청을 반복해도 결과가 같다.
 * 재시도가 의미 있는 것은 응답 자체를 받지 못한 네트워크 오류다.
 *
 * Supabase 는 계층마다 에러 형태가 다르다 — `PostgrestError` 는 HTTP status 없이
 * `code`(문자열)만 주고, `AuthError`·`FunctionsHttpError` 계열은 숫자 `status` 를 준다.
 * 한쪽만 보면 절반은 걸러지지 않으므로 둘 다 확인한다.
 */
export function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= MAX_RETRY) return false;

  const status = (error as { status?: unknown }).status;
  if (typeof status === "number" && status >= 400 && status < 500) return false;

  // code 가 있다는 것은 PostgREST 까지 도달해 거부됐다는 뜻이다.
  const code = (error as { code?: unknown }).code;
  if (typeof code === "string") return false;

  return true;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  /*
   * QueryClient 를 모듈 최상단 싱글턴으로 두지 않는다.
   * next build 가 정적 페이지를 만들 때 서버 렌더 패스가 돌아 인스턴스가 공유될 수 있고,
   * Strict Mode 의 이중 호출과도 얽힌다. useState 초기화 함수로 마운트당 하나만 만든다.
   */
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 화면을 오갈 때마다 재요청하지 않도록 한다. 개별 쿼리가 필요에 따라 오버라이드한다.
            staleTime: 60_000,
            // 클라이언트 오류(4xx·PostgREST 거부)는 재시도해도 같으므로 네트워크 오류만 재시도한다.
            retry: shouldRetry,
            // 앱이 포그라운드로 돌아올 때 신선도를 확보한다. staleTime 이 과요청을 막는다.
            refetchOnWindowFocus: true,
            // 모바일은 연결이 자주 끊긴다. 복구 시 다시 가져온다.
            refetchOnReconnect: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
