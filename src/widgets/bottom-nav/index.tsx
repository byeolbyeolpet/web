// 하단 탭 내비게이션 — 최소 뼈대(활성 상태 표시만). 폴리시된 디자인은 M1.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";

const TABS = [
  { href: "/", label: "홈" },
  { href: "/map", label: "지도" },
  { href: "/community", label: "커뮤니티" },
  { href: "/me", label: "마이" },
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
            className={cn(
              "flex min-h-14 flex-1 items-center justify-center text-sm",
              active ? "font-bold text-primary" : "text-muted-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
