"use client";
// 카드형 단일 선택 원시 — 종 선택 그리드와 성별 세그먼트가 공유한다.
// 버튼 배열로 만들면 "N개 중 하나"라는 관계를 스크린리더가 읽지 못한다.
// 레이아웃(그리드/세그먼트)은 호출부가 className 으로 정한다.

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { LuCheck } from "react-icons/lu";

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
  children,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-card"
      className={cn(
        // 최소 탭 영역 44px 이지만 52px 로 둔다 — 44 는 하한이지 목표가 아니고,
        // 선택 카드가 촘촘하면 오조작이 는다.
        "relative flex min-h-13 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2 text-sm font-medium transition-all outline-none select-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        // 탭 피드백. hover 에 기대지 않는다(터치 WebView).
        "active:scale-97",
        // 선택 상태는 종 태그와 같은 tint 계열로 — 브랜드 색을 한 단계 올린다(design-convention)
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary-tint data-[state=checked]:text-primary-tint-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {/* 선택을 색으로만 알리지 않는다 (CLAUDE.md UX 규칙). 미선택 시엔 렌더되지 않는다. */}
      {/* 카드 안 내용(아이콘·텍스트)의 배치와 무관하도록 모서리에 띄운다. */}
      <RadioGroupPrimitive.Indicator asChild>
        <LuCheck aria-hidden className="absolute top-1.5 right-1.5 size-3.5" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioCards, RadioCard };
