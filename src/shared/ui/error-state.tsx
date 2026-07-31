// 조회 실패 자리 — 스켈레톤이 영원히 도는 대신 무슨 일인지 말하고 길을 준다.
//
// 문구는 APP_MESSAGE 코드로만 받는다(app-message-convention). 원본 Supabase
// 에러를 화면에 흘리지 않기 위해서고, 같은 실패에 매번 다른 문장이 붙는 것도 막는다.
"use client";

import { LuRefreshCw, LuTriangleAlert } from "react-icons/lu";
import {
  APP_MESSAGE,
  type AppMessage,
  type AppMessageCode,
} from "@/shared/config/app-message";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export function ErrorState({
  code,
  onRetry,
  className,
}: {
  code: AppMessageCode;
  /** 다시 시도할 수 있는 실패에만 넘긴다. 없는 데이터에 재시도 버튼을 주면 거짓말이다. */
  onRetry?: () => void;
  className?: string;
}) {
  // 타입을 붙여서 받는다. APP_MESSAGE 는 as const 라 값마다 리터럴 타입이고,
  // description 이 없는 항목이 섞여 있어 유니온 상태로는 .description 을 못 읽는다.
  const message: AppMessage = APP_MESSAGE[code];

  return (
    <div
      // 실패는 스크린리더에도 전해져야 한다. 다만 alert 는 즉시 끼어들므로
      // 페이지 일부가 비는 이 상황에는 status 가 맞다.
      role="status"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-8 text-center",
        className,
      )}
    >
      {/* 색만으로 상태를 전달하지 않는다(CLAUDE.md) — 아이콘을 함께 둔다. */}
      <LuTriangleAlert aria-hidden className="size-5 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{message.title}</p>
        {message.description && (
          <p className="text-sm text-muted-foreground">{message.description}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <LuRefreshCw aria-hidden />
          다시 시도
        </Button>
      )}
    </div>
  );
}
