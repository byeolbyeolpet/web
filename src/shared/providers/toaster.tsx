// 토스트 표면 — 사용자 피드백 문구(APP_MESSAGE)가 실리는 곳.
"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

// 토스트가 뜨는 y 위치. 위(top-center)에 띄우되 노치·상태바(safe-area)와
// 셸 헤더(min-h-12=48px)를 지나 그 아래 8px 에서 시작한다 — 기본 오프셋(16px)으로는
// 앱에서 상태바에 깔려 안 보였다(#34 에뮬레이터 실측). 문자열 offset 은 sonner 가
// CSS 변수(--offset-top)에 그대로 넣어 calc·env 가 동작한다(v2.0.7 실측).
const TOAST_TOP_OFFSET = "calc(env(safe-area-inset-top) + 56px)";

export function Toaster() {
  const { theme = "system" } = useTheme();

  return (
    <SonnerToaster
      // 하단 탭 내비게이션·sticky CTA 와 겹치지 않도록 위에 띄운다.
      position="top-center"
      // offset 은 뷰포트 600px 초과(웹 데스크톱), mobileOffset 은 이하(앱)에 적용된다.
      // 어느 쪽이든 헤더 아래여야 하므로 같은 값을 준다.
      offset={{ top: TOAST_TOP_OFFSET }}
      mobileOffset={{ top: TOAST_TOP_OFFSET }}
      theme={theme as "light" | "dark" | "system"}
      // 상태를 색으로만 알리지 않도록 아이콘을 함께 노출한다.
      richColors
    />
  );
}
