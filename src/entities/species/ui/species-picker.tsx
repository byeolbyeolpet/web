"use client";
// 종 선택 그리드 — species 를 sort_order 순서 그대로 편다.
// 종이 늘어도 이 파일은 고치지 않는다: 순서도 그룹도 DB 가 갖는다(ADR-0005).
// 펫 등록 전용이 아니다 — 지도 필터·후기 방문종·커뮤니티 종 태그가 같은 UI 를 쓴다.

import * as React from "react";
import { LuChevronDown } from "react-icons/lu";
import { cn } from "@/shared/lib/utils";
import { RadioCard, RadioCards } from "@/shared/ui/radio-cards";
import { Skeleton } from "@/shared/ui/skeleton";
import { useQuerySpecies } from "../api/use-query-species";
import { SpeciesIcon } from "./species-icon";

// 시드 종 수(14). 로딩 자리표시가 실제 그리드와 같은 높이라 로드 후 레이아웃이 튀지 않는다.
const SKELETON_COUNT = 14;

export function SpeciesPicker({
  className,
  collapsible = false,
  value,
  onValueChange,
  ...props
}: React.ComponentProps<typeof RadioCards> & {
  /**
   * 고르면 그리드를 접고 선택한 종만 남긴다. 등록 폼처럼 아래에 다른 입력이
   * 이어지는 화면용이다. 지도 필터처럼 고른 결과를 바로 봐야 하는 곳에서는
   * 접히면 안 되므로 기본값은 false.
   */
  collapsible?: boolean;
}) {
  const { data, isPending } = useQuerySpecies();
  // 값이 이미 있는 채로 열리면(편집 화면) 접힌 상태로 시작한다.
  const [expanded, setExpanded] = React.useState(!value);

  if (isPending) {
    return (
      <div className="grid grid-cols-3 gap-2" aria-hidden>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  const selected = data?.find((species) => species.code === value);

  if (collapsible && !expanded && selected) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label={`선택한 종류 ${selected.name_ko}. 다시 고르려면 누르세요`}
        className={cn(
          "flex min-h-20 w-full items-center gap-3 rounded-lg border border-primary bg-primary-tint px-4",
          "text-sm font-medium text-primary-tint-foreground transition-all outline-none select-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-97",
        )}
      >
        <SpeciesIcon code={selected.code} className="size-9 shrink-0" />
        {selected.name_ko}
        <LuChevronDown aria-hidden className="ml-auto size-4 opacity-70" />
      </button>
    );
  }

  return (
    <RadioCards
      className={cn("grid-cols-3", className)}
      value={value}
      onValueChange={(next) => {
        onValueChange?.(next);
        // 고른 직후 접는다. 종은 한 번 고르면 다시 볼 일이 없는데
        // 14칸이 화면 절반을 계속 차지한다.
        if (collapsible) setExpanded(false);
      }}
      {...props}
    >
      {data?.map((species) => (
        <RadioCard
          key={species.code}
          value={species.code}
          className="min-h-20 flex-col gap-1 py-2 text-xs"
        >
          <SpeciesIcon code={species.code} className="size-9" />
          {species.name_ko}
        </RadioCard>
      ))}
    </RadioCards>
  );
}
