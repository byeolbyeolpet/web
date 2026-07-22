// TanStack Query 전역 Provider — 앱 전체가 하나의 쿼리 캐시를 공유하도록 감싼다.
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

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
            /*
             * 에러 종류를 가려 재시도하는 정책은 아직 넣지 않는다.
             * Supabase 의 PostgrestError 는 HTTP status 없이 code(문자열)만 주므로
             * 4xx 판별 같은 조건은 실제 쿼리를 붙여 에러 형태를 확인한 뒤 정한다.
             */
            retry: 2,
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
