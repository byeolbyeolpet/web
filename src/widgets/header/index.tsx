// (tabs) 셸 상단 헤더 — 워드마크. 크롬은 무채색으로 비운다(색은 CTA·활성 탭에만).
import { cn } from "@/shared/lib/utils";

// 헤더 높이. 하단 탭(min-h-14=56px)보다 낮춰 상·하 크롬의 위계를 준다.
const HEADER_HEIGHT = "min-h-12";

export function Header({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "flex items-center gap-2 border-b border-border bg-card px-4 pt-safe-top select-none",
        HEADER_HEIGHT,
        className,
      )}
    >
      {/*
       * 워드마크. 그래픽 심볼은 #18 에서 확정되면 이 span 왼쪽에 붙는다.
       * gap-2 로 자리를 미리 잡아 심볼이 들어와도 레이아웃이 흔들리지 않는다.
       */}
      <span className="font-heading text-lg font-bold tracking-tight text-foreground">
        별별펫
      </span>
    </header>
  );
}
