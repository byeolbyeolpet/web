// (full) 셸 — 바텀내비 없이 뒤로가기 중심으로 파고드는 전체화면 레이아웃.
import { type ReactNode } from "react";
import { BackButton } from "@/shared/ui/back-button";

export default function FullLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex min-h-12 items-center gap-2 border-b border-border bg-card px-4 pt-safe-top">
        <BackButton />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
