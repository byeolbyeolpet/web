// 앱 전역 Provider 합성 — layout 은 이것 하나만 감싼다.
"use client";

import type { ReactNode } from "react";
import { useAndroidBackButton } from "@/shared/lib/capacitor/use-android-back-button";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./toaster";

export function AppProviders({ children }: { children: ReactNode }) {
  // 네이티브에서만 동작한다. 웹에서는 아무것도 하지 않는다.
  useAndroidBackButton();

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
