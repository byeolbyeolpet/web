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
  DropdownMenuGroup,
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
  // 프로필 조회 중에도 마찬가지다 — 빈 이름의 pill 이 잠깐 떴다가 채워지면
  // 헤더가 두 번 흔들린다(CodeRabbit 지적). 조회 실패 시에는 스켈레톤이 아니라
  // "내 계정" fallback 으로 내려간다 — 프로필이 없어도 로그아웃은 돼야 하고,
  // 헤더에 재시도 UI 를 띄우는 것은 과하다.
  if (isLoading || (session && profile.isPending)) {
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
      {/* 트리거는 맨 아바타가 아니라 테두리 pill(아바타+이름)이다 — PixelPlay
          헤더 실측(h-36 rounded-full border+bg, 아바타 32px + 이름). 떠 있는
          원 하나보다 "눌리는 컨트롤"로 읽힌다. 시각 pill 은 36px 지만 바깥
          버튼이 44px 탭 영역을 만든다(CLAUDE.md — 그쪽은 데스크톱이라 36 이 끝). */}
      <DropdownMenuTrigger
        // 보이는 텍스트(닉네임)가 접근성 이름에도 들어가야 한다(WCAG 2.5.3) —
        // 음성 제어 사용자가 화면에 보이는 "지호"로 부를 수 있어야 한다.
        aria-label={`${nickname} 계정 메뉴`.trim()}
        className="group/trigger ml-auto flex min-h-11 items-center outline-none select-none"
      >
        <span className="flex h-9 items-center gap-2 rounded-full border border-border bg-card py-1 pr-2.5 pl-1 transition-colors group-focus-visible/trigger:ring-3 group-focus-visible/trigger:ring-ring/50 group-data-[state=open]/trigger:bg-muted">
          <Avatar className="size-7">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
            {/* 아바타는 장식이다 — 이름은 트리거의 aria-label 이 갖는다.
                이니셜까지 읽히면 "ㅈ 계정 메뉴" 처럼 겹쳐 읽힌다. */}
            <AvatarFallback
              aria-hidden
              className="bg-primary-tint font-heading text-xs font-bold text-primary-tint-foreground"
            >
              {initial}
            </AvatarFallback>
          </Avatar>
          {/* 닉네임이 길면 pill 이 워드마크를 밀어낸다 — 6자쯤에서 자른다.
              -translate-y-px 는 광학 보정이다: Noto Sans KR 은 메트릭이 위가
              무거워(20px 박스에 ascent 16 / descent 4) 글자 잉크가 박스 중심보다
              1px 아래에 그려진다(Range 실측: 잉크 중심 24.5 vs 박스 23.5).
              flex 는 박스를 맞출 뿐 잉크는 못 맞춘다. */}
          <span
            aria-hidden
            className="max-w-16 -translate-y-px truncate text-sm font-medium"
          >
            {nickname}
          </span>
        </span>
      </DropdownMenuTrigger>

      {/* 구조는 PixelPlay 의 로그인 후 프로필 메뉴를 따랐다(스크린샷 실측):
          맨 위에 **박스로 뜬 정체성 카드**(테두리 + 살짝 밝은 면) — 이름 위에
          브랜드색 꼬마 라벨(eyebrow)로 행선지를 적는다. "마이페이지에서 내 정보
          관리" 같은 설명 문장 대신 라벨 한 단어가 목적지를 말한다.
          로그아웃은 pill 버튼이 아니라 아이콘+라벨 평 행(무게 낮춤). */}
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-xl p-2"
      >
        {/* 아이템은 Group 안에 둔다(design-convention 6). */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            asChild
            className="rounded-lg border border-border bg-muted/40 p-3"
          >
            <Link
              href="/me"
              prefetch={false}
              className="flex items-center gap-3"
            >
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
                {/* 브랜드색 글자는 emphasis 다(text-primary 금지 — CLAUDE.md). */}
                <span className="text-xs font-bold text-primary-emphasis">
                  마이페이지
                </span>
                <span className="truncate font-heading text-sm font-bold">
                  {nickname || "내 계정"}
                </span>
              </span>
              <LuChevronRight
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
              />
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-2" />

          {/* min-h-11 은 공용 DropdownMenuItem 기본값이 됐다(6-1 표). */}
          <DropdownMenuItem
            disabled={signOut.isPending}
            onSelect={() => signOut.mutate()}
            className="gap-3 rounded-lg px-3 text-muted-foreground"
          >
            <LuLogOut aria-hidden />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
