// 카테고리 필터 칩 — 단일 선택, 재탭 해제 (스펙 §1). radiogroup 시맨틱.
"use client";

import { PLACE_CATEGORY_LIST, type PlaceCategory } from "@/entities/place";
import { cn } from "@/shared/lib/utils";

type CategoryChipsProps = {
  value: PlaceCategory | null;
  onChange: (value: PlaceCategory | null) => void;
};

const CHIPS: Array<{ code: PlaceCategory | null; label: string }> = [
  { code: null, label: "전체" },
  ...PLACE_CATEGORY_LIST.map(({ code, label }) => ({ code, label })),
];

export function CategoryChips({ value, onChange }: CategoryChipsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="장소 종류 필터"
      className="flex gap-2 overflow-x-auto px-4 py-2 select-none"
    >
      {CHIPS.map((chip) => {
        const active = value === chip.code;
        return (
          <button
            key={chip.label}
            type="button"
            role="radio"
            aria-checked={active}
            // 같은 칩 재탭 = 해제(전체). "전체" 재탭은 그대로 전체.
            onClick={() => onChange(active ? null : chip.code)}
            className={cn(
              "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium shadow-sm transition-colors",
              active
                ? "border-transparent bg-primary font-bold text-primary-foreground"
                : "border-border bg-card text-foreground",
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
