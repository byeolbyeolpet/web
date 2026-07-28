// 마이 화면 — 로그인 필수 (클라 가드). 프로필 카드 · 펫 목록 · 계정.
//
// 가운데 정렬로 쌓지 않고 카드·섹션으로 나눈다. 모든 요소가 화면 중앙에 놓이면
// 정보의 층위가 사라져 웹 페이지처럼 보인다 — 앱의 마이 화면은 좌측 정렬된
// 블록의 나열이다.
"use client";

import Link from "next/link";
import { m } from "motion/react";
import { LuLogOut, LuPlus } from "react-icons/lu";
import { PetCard, useQueryPets } from "@/entities/pet";
import { SpeciesIcon } from "@/entities/species";
import { useQueryProfile } from "@/entities/user";
import { useRequireSession, useSignOut } from "@/features/auth";
import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { riseIn, riseInList } from "@/shared/lib/motion";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { NicknameEditor } from "./nickname-editor";

const SHELL = "mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4";

export function MeView() {
  const { session, isLoading } = useRequireSession();
  const profile = useQueryProfile(session?.user.id);
  const pets = useQueryPets(session?.user.id);
  const signOut = useSignOut();

  // 세션 미확정이거나 리다이렉트 직전 — 빈 화면 대신 스켈레톤.
  // 실제 블록과 같은 크기로 둬야 로드 후 레이아웃이 튀지 않는다.
  if (isLoading || !session) {
    return (
      <div className={SHELL}>
        <Skeleton className="h-22 w-full rounded-lg" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  const hasPets = Boolean(pets.data?.length);

  return (
    <div className={SHELL}>
      <section className="flex min-h-22 items-center gap-3 rounded-lg border border-border bg-card p-4">
        {/* 아바타 — 이미지가 없으면 닉네임 첫 글자로 이니셜 원 */}
        {profile.data?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- 원격 아바타는 unoptimized 정책(ADR-0002)
          <img
            src={profile.data.avatar_url}
            alt="프로필 사진"
            className="size-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-tint font-heading text-xl font-bold text-primary-tint-foreground select-none"
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
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex min-h-9 items-center justify-between">
          <h2 className="font-heading text-base font-bold">나의 반려동물</h2>
          {/* 목록이 있을 때만 헤더에 작은 추가 버튼을 둔다. 비어 있을 때는
              아래 빈 상태의 CTA 하나로 모아야 눌러야 할 곳이 분명해진다. */}
          {hasPets && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pet/new">
                <LuPlus />
                추가
              </Link>
            </Button>
          )}
        </div>

        {pets.isPending ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : hasPets ? (
          // 등록 직후 돌아오면 새 카드가 목록에 얹히는 게 보여야 한다.
          <m.ul
            variants={riseInList}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-2"
          >
            {pets.data?.map((pet) => (
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
          // 점선 테두리로 "채워질 자리"임을 알린다. 실선 카드로 두면 이미 무언가
          // 등록된 것처럼 읽힌다.
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-8">
            <p className="text-sm text-muted-foreground">
              아직 등록한 아이가 없어요
            </p>
            <Button size="sm" asChild>
              <Link href="/pet/new">
                <LuPlus />
                반려동물 등록하기
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* 계정 조작은 화면 맨 아래에, 가장 약한 톤으로. 자주 쓰는 기능이 아니고
          잘못 누르면 되돌리는 데 로그인이 다시 필요하다. */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-auto self-start text-muted-foreground"
        onClick={() => signOut.mutate()}
        loading={signOut.isPending}
      >
        <LuLogOut />
        로그아웃
      </Button>
    </div>
  );
}
