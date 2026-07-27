// 앱 전역 Provider 합성 — layout 은 이것 하나만 감싼다.
"use client";

import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { useAndroidBackButton } from "@/shared/lib/capacitor/use-android-back-button";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./toaster";

export function AppProviders({ children }: { children: ReactNode }) {
  // 네이티브에서만 동작한다. 웹에서는 아무것도 하지 않는다.
  useAndroidBackButton();

  /*
   * LazyMotion + domAnimation 으로 기능 번들을 좁힌다. 전체 motion 을 그대로
   * 쓰면 JS 가 286KB 늘어나는데(실측 1436→1723KB) 우리가 쓰는 건 variants 와
   * stagger 뿐이다. domAnimation 은 애니메이션·variants·exit·제스처까지 담고
   * drag·layout 만 뺀다. strict 를 켜서 `motion.div` 를 쓰면 에러가 나고
   * `m.div` 를 쓰도록 강제한다 — 섞이면 번들 축소가 무의미해진다.
   *
   * MotionConfig reducedMotion="user" 는 모든 motion 컴포넌트가 OS 의
   * "동작 줄이기"를 따르게 한다. globals.css 의 prefers-reduced-motion 가드는
   * CSS transition 만 막고 motion 의 인라인 스타일은 통과하므로, 이게 없으면
   * 컴포넌트마다 useReducedMotion 을 붙여야 한다.
   *
   * Toaster 가 useTheme 을 읽으므로 ThemeProvider 안쪽에 둔다.
   */
  return (
    <ThemeProvider>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </MotionConfig>
      </LazyMotion>
    </ThemeProvider>
  );
}
