// 토스트 표면 — 사용자 피드백 문구(APP_MESSAGE)가 실리는 곳.
"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  const { theme = "system" } = useTheme();

  return (
    <SonnerToaster
      // 하단 탭 내비게이션과 겹치지 않도록 위에 띄운다.
      position="top-center"
      theme={theme as "light" | "dark" | "system"}
      // 상태를 색으로만 알리지 않도록 아이콘을 함께 노출한다.
      richColors
    />
  );
}
