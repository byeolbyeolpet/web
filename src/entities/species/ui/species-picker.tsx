"use client";
// 종 선택 그리드 — species 를 sort_order 순서 그대로 편다.
// 종이 늘어도 이 파일은 고치지 않는다: 순서도 그룹도 DB 가 갖는다(ADR-0005).
// 펫 등록 전용이 아니다 — 지도 필터·후기 방문종·커뮤니티 종 태그가 같은 UI 를 쓴다.

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { RadioCard, RadioCards } from "@/shared/ui/radio-cards";
import { Skeleton } from "@/shared/ui/skeleton";
import { useQuerySpecies } from "../api/use-query-species";

// 시드 종 수(14). 로딩 자리표시가 실제 그리드와 같은 높이라 로드 후 레이아웃이 튀지 않는다.
const SKELETON_COUNT = 14;

export function SpeciesPicker({
  className,
  ...props
}: React.ComponentProps<typeof RadioCards>) {
  const { data, isPending } = useQuerySpecies();

  if (isPending) {
    return (
      <div className="grid grid-cols-3 gap-2" aria-hidden>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <Skeleton key={i} className="h-11 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <RadioCards className={cn("grid-cols-3", className)} {...props}>
      {data?.map((species) => (
        <RadioCard key={species.code} value={species.code}>
          {species.name_ko}
        </RadioCard>
      ))}
    </RadioCards>
  );
}
