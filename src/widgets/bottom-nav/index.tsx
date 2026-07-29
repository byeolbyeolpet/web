// 하단 탭 내비게이션 — 아이콘 + 라벨. 활성 탭만 바이올렛(stroke 색 + 굵은 라벨).
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuHouse, LuMap, LuMessageCircle, LuUser } from "react-icons/lu";
import { cn } from "@/shared/lib/utils";

// 아이콘은 react-icons 위주로 쓴다(lu 세트). Lucide 는 전부 stroke(currentColor)
// 아이콘이라, text 색만 바꾸면 아이콘 획 색이 따라온다.
// 커뮤니티는 말풍선(글·소통)으로 골라 마이의 사람 아이콘과 시각적으로 갈리게 했다.
const TABS = [
  { href: "/", label: "홈", Icon: LuHouse },
  { href: "/map", label: "지도", Icon: LuMap },
  { href: "/community", label: "커뮤니티", Icon: LuMessageCircle },
  { href: "/me", label: "마이", Icon: LuUser },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="flex border-t border-border bg-card pb-safe-bottom select-none">
      {TABS.map((tab) => {
        const active =
          tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-1",
              // 색 단독 전달 금지(CLAUDE.md) — 라벨 굵기를 함께 바꿔 색맹도 구분되게 한다.
              // 글자에는 --primary 가 아니라 emphasis 를 쓴다. 다크에서 --primary 는
              // 흰 글씨를 받는 "면" 기준이라 카드 위 글자로는 3.34:1 로 미달한다.
              active ? "text-primary-emphasis" : "text-muted-foreground",
            )}
          >
            <tab.Icon aria-hidden className="size-6" />
            <span
              className={cn("text-xs", active ? "font-bold" : "font-normal")}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
