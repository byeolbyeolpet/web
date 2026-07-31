// 헤더 우측 프로필 — 아바타를 누르면 계정 메뉴가 열린다.
//
// 계정 조작을 마이 화면 본문에서 헤더로 올린 이유: 로그아웃은 자주 쓰지 않는데
// 화면 한 블록을 차지하고 있었고, 어느 탭에 있든 닿을 수 있는 편이 맞다.
//
// (tabs) 셸에만 둔다. (full) 화면은 뒤로가기로 파고든 작업 맥락이라 계정 메뉴를
// 띄우면 하던 일을 두고 나가라고 권하는 꼴이 된다.
"use client";

import Link from "next/link";
import { LuLogOut } from "react-icons/lu";
import { useQueryProfile } from "@/entities/user";
import { useSession, useSignOut } from "@/features/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

  return (
    <DropdownMenu>
      {/* 아바타 자체는 32px 이라 탭 영역이 모자란다. 버튼이 44px 를 만들고
          아바타는 그 안에 놓인다(CLAUDE.md 최소 탭 영역). */}
      <DropdownMenuTrigger
        aria-label="계정 메뉴"
        className="-mr-2 ml-auto flex min-h-11 min-w-11 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar>
          {profile.data?.avatar_url && (
            <AvatarImage src={profile.data.avatar_url} alt="" />
          )}
          {/* 아바타는 장식이다 — 이름은 트리거의 aria-label 이 갖는다.
              이니셜까지 읽히면 "ㅈ 계정 메뉴" 처럼 겹쳐 읽힌다. */}
          <AvatarFallback
            aria-hidden
            className="bg-primary-tint font-heading font-bold text-primary-tint-foreground"
          >
            {nickname.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-44">
        {/* 누구로 로그인돼 있는지 먼저 말한다. 계정이 여러 개인 사람에게
            로그아웃 직전 확인이 되는 자리다. */}
        <DropdownMenuLabel className="truncate">
          {nickname || "내 계정"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signOut.isPending}
          onSelect={() => signOut.mutate()}
        >
          <LuLogOut aria-hidden />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
