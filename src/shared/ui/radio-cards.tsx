"use client";
// 카드형 단일 선택 원시 — 종 선택 그리드와 성별 세그먼트가 공유한다.
// 버튼 배열로 만들면 "N개 중 하나"라는 관계를 스크린리더가 읽지 못한다.
// 레이아웃(그리드/세그먼트)은 호출부가 className 으로 정한다.

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { cn } from "@/shared/lib/utils";

function RadioCards({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-cards"
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}

function RadioCard({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-card"
      className={cn(
        // 최소 탭 영역 44px (CLAUDE.md UX 규칙)
        "flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-2 text-sm font-medium transition-colors outline-none select-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        // 선택 상태는 종 태그와 같은 tint 계열로 — 브랜드 색을 한 단계 올린다(design-convention)
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary-tint data-[state=checked]:text-primary-tint-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { RadioCards, RadioCard };
