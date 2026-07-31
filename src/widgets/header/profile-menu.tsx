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

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-xl p-2"
      >
        {/* 프로필 카드 — 이 메뉴에서 가장 큰 탭 영역이자 첫 초점. 라벨이 아니라
            목적지다(마이페이지). 큰 아바타 + 이름 + 행선지, 우측 chevron 은
            "눌리는 행"이라는 관례 신호다. */}
        <DropdownMenuItem asChild className="rounded-lg p-2">
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
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-heading text-sm font-bold">
                {nickname || "내 계정"}
              </span>
              <span className="text-xs text-muted-foreground">
                마이페이지에서 내 정보 관리
              </span>
            </span>
            <LuChevronRight
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground"
            />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          disabled={signOut.isPending}
          onSelect={() => signOut.mutate()}
          className="min-h-11 rounded-lg px-2 text-muted-foreground"
        >
          <LuLogOut aria-hidden />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
