// 뒤로가기 버튼 — (full) 레이아웃 헤더용. 이전 화면으로 돌아간다.
"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="뒤로 가기"
      className="flex min-h-11 min-w-11 items-center gap-1 text-sm text-muted-foreground select-none"
    >
      <span aria-hidden>←</span> 뒤로
    </button>
  );
}
