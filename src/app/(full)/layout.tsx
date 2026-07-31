// (full) 셸 — 바텀내비 없이 뒤로가기 중심으로 파고드는 전체화면 레이아웃.
import { type ReactNode } from "react";
import { BackButton } from "@/shared/ui/back-button";
import { ProfileMenu } from "@/widgets/header";

export default function FullLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* 계정 진입점은 (tabs) 헤더와 같다 — 헤더는 셸의 일부라 화면마다
          있다 없다 하면 위치를 학습할 수 없다. */}
      <header className="flex min-h-12 items-center gap-2 border-b border-border bg-card px-4 pt-safe-top">
        <BackButton />
        <ProfileMenu />
      </header>
      {/* safe-area 는 셸이 맡는다. 화면·폼이 p-4 와 함께 pb-safe-bottom 을 주면
          tailwind-merge 가 p-4 의 아래쪽을 지우고, 웹에서 inset 은 0이라 여백이 사라진다. */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col pb-safe-bottom">
        {children}
      </main>
    </div>
  );
}
