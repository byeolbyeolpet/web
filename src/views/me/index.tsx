// 마이 화면 — 로그인 필수 (클라 가드). 프로필 기본: 아바타·닉네임·펫 목록·로그아웃.
"use client";

import Link from "next/link";
import { useRequireSession, useSignOut } from "@/features/auth";
import { m } from "motion/react";
import { PetCard, useQueryPets } from "@/entities/pet";
import { SpeciesIcon } from "@/entities/species";
import { riseIn, riseInList } from "@/shared/lib/motion";
import { useQueryProfile } from "@/entities/user";
import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { NicknameEditor } from "./nickname-editor";

export function MeView() {
  const { session, isLoading } = useRequireSession();
  const profile = useQueryProfile(session?.user.id);
  const pets = useQueryPets(session?.user.id);
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
          {APP_MESSAGE[APP_MESSAGE_CODE.profile.loadFailed].description}
        </p>
      )}

      <section className="flex w-full max-w-80 flex-col gap-3">
        <h2 className="font-heading text-base font-bold">나의 반려동물</h2>

        {pets.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : pets.data?.length ? (
          // 등록 직후 돌아오면 새 카드가 목록에 얹히는 게 보여야 한다.
          <m.ul
            variants={riseInList}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-2"
          >
            {pets.data.map((pet) => (
              <m.li key={pet.id} variants={riseIn}>
                <PetCard
                  pet={pet}
                  speciesIcon={
                    <SpeciesIcon
                      code={pet.species.code}
                      className="size-10 shrink-0"
                    />
                  }
                />
              </m.li>
            ))}
          </m.ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            아직 등록한 반려동물이 없어요.
          </p>
        )}

        <Button variant="outline" asChild>
          <Link href="/pet/new">반려동물 등록하기</Link>
        </Button>
      </section>

      <Button
        variant="outline"
        onClick={() => signOut.mutate()}
        loading={signOut.isPending}
      >
        로그아웃
      </Button>
    </div>
  );
}
