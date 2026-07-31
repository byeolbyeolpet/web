// 헤더 우측 프로필 — 아바타를 누르면 계정 카드가 열린다.
//
// (tabs)·(full) 두 셸이 함께 쓴다. 헤더는 셸의 일부라 화면마다 있다 없다 하면
// 위치를 학습할 수 없다.
//
// 메뉴의 첫 항목은 "마이페이지로 가는 프로필 카드"다. 하단 탭에도 마이가 있지만
// (full) 화면에는 탭바가 없다 — 깊이 들어간 화면에서 내 정보로 건너뛰는 지름길은
// 여기뿐이다. 탭 화면에서는 같은 목적지가 두 곳인 셈인데, 그건 중복이 아니라
// 관성이다(어디서든 아바타 → 내 정보).
"use client";

import Link from "next/link";
import { LuChevronRight, LuLogOut } from "react-icons/lu";
import { useQueryProfile } from "@/entities/user";
import { useSession, useSignOut } from "@/features/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Skeleton } from "@/shared/ui/skeleton";

export function ProfileMenu() {
  const { session, isLoading } = useSession();
  const profile = useQueryProfile(session?.user.id);
  const signOut = useSignOut();

  // 세션 미확정 구간에 아무것도 안 그리면 로그인 상태에서 아바타가 뒤늦게
  // 끼어들며 헤더가 흔들린다. 같은 크기의 자리를 먼저 잡아 둔다.
  if (isLoading) {
    return <Skeleton className="ml-auto size-8 rounded-full" />;
  }

  if (!session) {
    return (
      <Button variant="ghost" size="sm" className="ml-auto" asChild>
        <Link href="/login" prefetch={false}>
          로그인
        </Link>
      </Button>
    );
  }

  const nickname = profile.data?.nickname ?? "";
  const initial = nickname.slice(0, 1);
  const avatarUrl = profile.data?.avatar_url;
  // 이메일은 profiles 가 아니라 세션에 있다 — Google OAuth 계정이라 항상 오지만
  // 타입상 optional 이므로 없으면 줄을 뺀다.
  const email = session.user.email;

  return (
    <DropdownMenu>
      {/* 아바타 자체는 32px 이라 탭 영역이 모자란다. 버튼이 44px 를 만들고
          아바타는 그 안에 놓인다(CLAUDE.md 최소 탭 영역). */}
      <DropdownMenuTrigger
        aria-label="계정 메뉴"
        className="-mr-2 ml-auto flex min-h-11 min-w-11 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar>
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          {/* 아바타는 장식이다 — 이름은 트리거의 aria-label 이 갖는다.
              이니셜까지 읽히면 "ㅈ 계정 메뉴" 처럼 겹쳐 읽힌다. */}
          <AvatarFallback
            aria-hidden
            className="bg-primary-tint font-heading font-bold text-primary-tint-foreground"
          >
            {initial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      {/* 구조는 PixelPlay 의 프로필 팝오버를 따랐다(pixel-play.studio 실측):
          p-0 콘텐츠에 [정체성 행(전체가 링크)] + [pill 액션 2개] 두 층.
          부제는 지시문이 아니라 정보다 — "마이페이지에서 내 정보 관리" 같은
          설명서 문장은 이메일(내가 누구로 들어와 있는지)로 바꿨다. */}
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 rounded-2xl p-0"
      >
        <DropdownMenuItem asChild className="rounded-none p-4">
          <Link href="/me" prefetch={false} className="flex items-center gap-3">
            <Avatar size="lg">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
              <AvatarFallback
                aria-hidden
                className="bg-primary-tint font-heading font-bold text-primary-tint-foreground"
              >
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              {/* 이름이 이 카드의 주인공이다 — 본문보다 한 급 크고 무겁게. */}
              <span className="truncate font-heading text-base font-bold">
                {nickname || "내 계정"}
              </span>
              {email && (
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              )}
            </span>
            <LuChevronRight
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground"
            />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-0" />

        {/* pill 액션 행 — 주 행동(마이페이지)만 브랜드 면, 로그아웃은 중립.
            높이는 44px(h-11) 아래로 내리지 않는다(CLAUDE.md — PixelPlay 는
            데스크톱이라 32px 를 쓰지만 우리는 터치다). */}
        <div className="grid grid-cols-2 gap-2 p-3">
          <DropdownMenuItem asChild className="p-0">
            <Link
              href="/me"
              prefetch={false}
              className="flex min-h-11 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground"
            >
              마이페이지
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={signOut.isPending}
            onSelect={() => signOut.mutate()}
            className="flex min-h-11 items-center justify-center rounded-full bg-secondary p-0 font-medium text-secondary-foreground"
          >
            <LuLogOut aria-hidden />
            로그아웃
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
