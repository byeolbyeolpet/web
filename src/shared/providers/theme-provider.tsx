// 다크모드 Provider — <html> 에 .dark 클래스만 토글한다.
// globals.css 의 :root / .dark 가 같은 CSS 변수를 덮어쓰므로 컴포넌트는 시맨틱 클래스만 쓰면 된다.
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      // globals.css 가 @custom-variant dark (&:is(.dark *)) 로 .dark 클래스를 본다.
      attribute="class"
      defaultTheme="system"
      enableSystem
      // 테마 전환 순간 모든 요소가 트랜지션되며 깜빡이는 것을 막는다.
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
