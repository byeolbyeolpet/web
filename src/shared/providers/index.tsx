// 앱 전역 Provider 합성 — layout 은 이것 하나만 감싼다.
"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./toaster";

export function AppProviders({ children }: { children: ReactNode }) {
  // Toaster 가 useTheme 을 읽으므로 ThemeProvider 안쪽에 둔다.
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
        <Toaster />
      </QueryProvider>
    </ThemeProvider>
  );
}
