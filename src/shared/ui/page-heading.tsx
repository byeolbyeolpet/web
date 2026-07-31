// 화면 제목 블록 — (full) 화면들의 첫 덩어리.
//
// Title 은 명사형, Description 은 문장형이다(APP_MESSAGE 와 같은 규칙).
// 헤더에는 페이지명을 넣지 않기로 했으므로 "여기가 어디인가"를 말하는 건
// 이 블록 하나뿐이다 — 화면마다 다르게 생기면 안 된다.
//
// description 이 ReactNode 인 이유: 펫 이름처럼 문장 일부만 브랜드 색으로
// 강조하는 경우가 있다. 문자열로 받고 내부에서 자르면 어디를 강조할지
// 이 컴포넌트가 알아야 해서, 강조는 호출부에 맡긴다.

import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export function PageHeading({
  title,
  description,
  className,
}: {
  title: string;
  description?: ReactNode;
  className?: string;
}) {
  return (
    // break-keep 이 없으면 한국어가 어절 중간에서 끊긴다("아이/를").
    <div className={cn("flex flex-col gap-2 px-4 pt-6 pb-5", className)}>
      <h1 className="font-heading text-2xl font-bold text-balance break-keep">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-balance break-keep text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
