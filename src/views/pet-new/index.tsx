// 펫 등록 화면 — 로그인 필수 (클라 가드, ADR-0004). 질문형 제목 + 등록 폼.
"use client";

import { useRequireSession } from "@/features/auth";
import { PetForm } from "@/features/register-pet";
import { Skeleton } from "@/shared/ui/skeleton";

export function PetNewView() {
  const { session, isLoading } = useRequireSession();

  // 세션 미확정이거나 리다이렉트 직전 — 빈 화면 대신 스켈레톤.
  if (isLoading || !session) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-6 pb-5 font-heading text-2xl font-bold">
        어떤 아이와 함께하나요?
      </h1>
      <PetForm ownerId={session.user.id} />
    </div>
  );
}
