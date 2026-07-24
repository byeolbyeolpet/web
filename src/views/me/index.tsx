// 마이 화면 — 로그인 필수 (클라 가드). 프로필 기본: 아바타·닉네임·로그아웃.
"use client";

import { useRequireSession, useSignOut } from "@/features/auth";
import { useQueryProfile } from "@/entities/user";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { NicknameEditor } from "./nickname-editor";

export function MeView() {
  const { session, isLoading } = useRequireSession();
  const profile = useQueryProfile(session?.user.id);
  const signOut = useSignOut();

  // 세션 미확정이거나 리다이렉트 직전 — 빈 화면 대신 스켈레톤.
  if (isLoading || !session) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-6 w-32" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      {/* 아바타 — 이미지가 없으면 닉네임 첫 글자로 이니셜 원 */}
      {profile.data?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- 원격 아바타는 unoptimized 정책(ADR-0002)
        <img
          src={profile.data.avatar_url}
          alt="프로필 사진"
          className="size-20 rounded-full object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex size-20 items-center justify-center rounded-full bg-primary-tint font-heading text-2xl font-bold text-primary-tint-foreground select-none"
        >
          {profile.data?.nickname.slice(0, 1) ?? ""}
        </div>
      )}

      {profile.isPending ? (
        <Skeleton className="h-6 w-32" />
      ) : profile.data ? (
        <NicknameEditor
          userId={session.user.id}
          nickname={profile.data.nickname}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          프로필을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      <Button
        variant="outline"
        onClick={() => signOut.mutate()}
        disabled={signOut.isPending}
      >
        {signOut.isPending ? "로그아웃 중…" : "로그아웃"}
      </Button>
    </div>
  );
}
