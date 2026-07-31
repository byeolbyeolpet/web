// 마이 화면 — 로그인 필수 (클라 가드). 프로필 · 펫 목록.
//
// 구조는 모바일 앱 마이 화면의 일반형을 따랐다(Dribbble "Smart Pet Care Profile"
// 등 참고):
//  - 프로필은 카드로 감싸지 않는다. 화면 맨 위 블록이라 경계선이 없어도 위치가
//    곧 위계다. 카드로 묶으면 아래 목록 카드들과 같은 무게가 돼 층위가 사라진다.
//  - 목록은 항목마다 카드를 띄우지 않고 **그룹 카드 하나에 divide-y** 로 나눈다.
//    항목이 늘수록 떠 있는 카드는 산만해지고 경계선이 겹쳐 보인다.
//  - 계정 조작(로그아웃)은 여기 없다 — 헤더의 ProfileMenu 로 올렸다.
"use client";

import { useState } from "react";
import Link from "next/link";
import { m } from "motion/react";
import { LuPencil, LuPlus } from "react-icons/lu";
import { PetCard, useQueryPets } from "@/entities/pet";
import { SpeciesIcon } from "@/entities/species";
import { useQueryProfile } from "@/entities/user";
import { useRequireSession } from "@/features/auth";
import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { riseIn, riseInList } from "@/shared/lib/motion";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { NicknameEditor } from "./nickname-editor";

const SHELL = "mx-auto flex w-full max-w-md flex-1 flex-col gap-7 p-4";
const GROUP_CARD = "overflow-hidden rounded-lg border border-border bg-card";
const SECTION_TITLE = "px-1 font-heading text-base font-bold";

export function MeView() {
  const { session, isLoading } = useRequireSession();
  const profile = useQueryProfile(session?.user.id);
  const pets = useQueryPets(session?.user.id);
  const [editingNickname, setEditingNickname] = useState(false);

  // 세션 미확정이거나 리다이렉트 직전 — 빈 화면 대신 스켈레톤.
  // 실제 블록과 같은 크기로 둬야 로드 후 레이아웃이 튀지 않는다.
  if (isLoading || !session) {
    return (
      <div className={SHELL}>
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="size-16 shrink-0 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  const petCount = pets.data?.length ?? 0;

  return (
    <div className={SHELL}>
      {/* 편집 중에는 폼이 세로로 길어지므로 아바타를 위쪽에 붙인다. */}
      <div
        className={cn(
          "flex gap-4 pt-2",
          editingNickname ? "items-start" : "items-center",
        )}
      >
        {/* 이미지가 없으면 닉네임 첫 글자로 이니셜 원. 이미지 로드 실패까지
            Avatar 가 알아서 fallback 으로 돌린다 — 손으로 만들었을 때는
            깨진 이미지 아이콘이 그대로 남았다. */}
        <Avatar className="size-16">
          {profile.data?.avatar_url && (
            <AvatarImage src={profile.data.avatar_url} alt="프로필 사진" />
          )}
          <AvatarFallback
            aria-hidden
            className="bg-primary-tint font-heading text-2xl font-bold text-primary-tint-foreground"
          >
            {profile.data?.nickname.slice(0, 1) ?? ""}
          </AvatarFallback>
        </Avatar>

        {profile.isPending ? (
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : !profile.data ? (
          <p className="text-sm text-muted-foreground">
            {APP_MESSAGE[APP_MESSAGE_CODE.profile.loadFailed].description}
          </p>
        ) : editingNickname ? (
          <NicknameEditor
            userId={session.user.id}
            nickname={profile.data.nickname}
            onDone={() => setEditingNickname(false)}
          />
        ) : (
          <>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-heading text-lg font-bold">
                {profile.data.nickname}
              </span>
              {/* 이름만 있으면 프로필이 비어 보인다. 이 앱에서 나를 설명하는 숫자는 펫 수다.
                  isPending 이 아니라 data 로 가른다 — 조회가 실패했을 때 0마리라고
                  적으면 "없다"는 거짓말이 된다(빈 배열은 truthy 라 0마리는 그대로 나온다). */}
              {pets.data && (
                <p className="text-sm text-muted-foreground">
                  반려동물 {petCount}마리
                </p>
              )}
            </div>
            {/* 버튼을 이름과 같은 줄(텍스트 블록 안)에 두면 44px 터치 영역이 그
                줄의 높이를 지배해 아바타와 세로 중심이 어긋난다. 행 레벨에 둔다. */}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="닉네임 수정"
              onClick={() => setEditingNickname(true)}
            >
              <LuPencil />
            </Button>
          </>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex min-h-9 items-center justify-between">
          <h2 className={SECTION_TITLE}>나의 반려동물</h2>
          {/* 목록이 있을 때만 헤더에 추가 버튼을 둔다. 비어 있을 때는 아래 빈
              상태의 CTA 하나로 모아야 눌러야 할 곳이 분명해진다. */}
          {petCount > 0 && (
            <Button
              variant="secondary"
              size="icon-sm"
              className="rounded-full"
              aria-label="반려동물 등록"
              asChild
            >
              <Link href="/pet/new" prefetch={false}>
                <LuPlus />
              </Link>
            </Button>
          )}
        </div>

        {pets.isPending ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : pets.isError ? (
          // 실패를 스켈레톤으로 두면 영원히 도는 화면이 된다. 무슨 일인지 말하고
          // 다시 시도할 길을 준다 — 목록은 재시도가 의미 있는 조회다.
          <ErrorState
            code={APP_MESSAGE_CODE.pet.loadFailed}
            onRetry={() => pets.refetch()}
          />
        ) : petCount > 0 ? (
          // 등록 직후 돌아오면 새 카드가 목록에 얹히는 게 보여야 한다.
          <m.ul
            variants={riseInList}
            initial="hidden"
            animate="visible"
            className={`${GROUP_CARD} divide-y divide-border`}
          >
            {pets.data?.map((pet) => (
              <m.li key={pet.id} variants={riseIn}>
                <PetCard
                  pet={pet}
                  href={`/pet/edit/?id=${pet.id}`}
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
          // 점선 테두리로 "채워질 자리"임을 알린다. 실선 카드로 두면 이미 뭔가
          // 등록된 것처럼 읽힌다.
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-8">
            <p className="text-sm text-muted-foreground">
              아직 등록한 아이가 없어요
            </p>
            <Button size="sm" asChild>
              <Link href="/pet/new" prefetch={false}>
                <LuPlus />
                반려동물 등록하기
              </Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
