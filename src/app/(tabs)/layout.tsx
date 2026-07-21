// (tabs) 셸 — 상단 헤더 + 하단 바텀내비가 유지되는 상시 목적지 레이아웃.
import { type ReactNode } from "react";
import { BottomNav } from "@/widgets/bottom-nav";

export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex min-h-12 items-center border-b border-border bg-card px-4 pt-safe-top">
        <span className="font-heading font-bold text-anchor select-none">
          별별펫
        </span>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <BottomNav />
    </div>
  );
}
