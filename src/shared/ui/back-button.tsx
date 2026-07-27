// 뒤로가기 버튼 — (full) 레이아웃 헤더용. 이전 화면으로 돌아간다.
"use client";

import { useRouter } from "next/navigation";
import { LuChevronLeft } from "react-icons/lu";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="뒤로 가기"
      className="-ml-2 flex min-h-11 min-w-11 items-center justify-center text-muted-foreground transition-colors select-none active:text-foreground"
    >
      <LuChevronLeft aria-hidden className="size-6" />
    </button>
  );
}
