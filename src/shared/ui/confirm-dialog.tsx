// 확인 대화상자 — 되돌릴 수 없는 조작 앞에서 한 번 멈춘다.
//
// **원본 AlertDialog 를 그대로 쓰지 않는 이유는 데스크톱 밀도라서다.**
// 원본은 max-w-xs 폭에 p-4, 버튼이 32px(h-8), footer 에 bg-muted/50 + 상단
// 경계선이 깔린다. 창 안에 또 하나의 회색 띠가 생기는 구조라 모바일 전면에서
// 보면 산만하고, 44px 규칙(CLAUDE.md)에도 걸린다. 여기서 바꾼 것:
//
//  - 폭을 화면에 맞추고(좌우 여백만 남김) 라운드·여백을 키웠다
//  - 아이콘을 tint 원형으로 올려 무슨 종류의 확인인지 색·모양으로 먼저 말한다
//  - footer 의 회색 띠를 없애고 버튼을 44px 이상 2열로 폈다
//  - 문구는 APP_MESSAGE 코드로만 받는다(ErrorState 와 같은 규칙)
//
// **브랜드 색으로 창을 칠하지 않는다.** 크롬은 무채색이고 색은 의미가 있을
// 때만 나온다(CLAUDE.md). 여기서 색이 하는 일은 "이건 지우는 조작이다" 하나뿐이라
// destructive tint 아이콘과 확인 버튼에만 쓴다.
"use client";

import type { ReactNode } from "react";
import { LuTrash2, LuTriangleAlert } from "react-icons/lu";
import {
  APP_MESSAGE,
  type AppMessage,
  type AppMessageCode,
} from "@/shared/config/app-message";
import { cn } from "@/shared/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";

const TONE = {
  destructive: {
    Icon: LuTrash2,
    // 글자·아이콘은 emphasis — tint 면 위 원색은 AA 미달(globals.css 참고).
    circle: "bg-destructive/10 text-destructive-emphasis",
  },
  warning: {
    Icon: LuTriangleAlert,
    circle: "bg-warning/10 text-warning",
  },
} as const;

export function ConfirmDialog({
  trigger,
  code,
  confirmLabel,
  cancelLabel = "취소",
  tone = "destructive",
  onConfirm,
}: {
  trigger: ReactNode;
  /** 제목·설명을 담은 APP_MESSAGE 코드. 문구를 호출부에 흩지 않는다. */
  code: AppMessageCode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: keyof typeof TONE;
  onConfirm: () => void;
}) {
  // 타입을 붙여서 받는다 — APP_MESSAGE 는 as const 라 description 이 없는 항목이
  // 섞인 유니온이 되고, 그 상태로는 .description 을 읽지 못한다.
  const message: AppMessage = APP_MESSAGE[code];
  const { Icon, circle } = TONE[tone];

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

      <AlertDialogContent
        className={cn(
          // 원본은 max-w-xs 고정이라 모바일에서 가운데 작게 뜬다. 좌우 여백만
          // 남기고 최대 폭을 본문(max-w-md)과 맞춰 화면과 같은 리듬을 준다.
          "w-[calc(100%-2rem)] max-w-md gap-5 rounded-2xl p-6",
          "sm:max-w-sm",
        )}
      >
        <AlertDialogHeader className="gap-3">
          {/* 색만으로 전달하지 않는다 — 아이콘 모양이 종류를 먼저 말한다. */}
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-full",
              circle,
            )}
          >
            <Icon aria-hidden className="size-5" />
          </div>
          <AlertDialogTitle className="font-heading text-lg font-bold">
            {message.title}
          </AlertDialogTitle>
          {message.description && (
            <AlertDialogDescription className="text-sm break-keep">
              {message.description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {/* 원본 footer 의 회색 띠·경계선을 지운다(className 으로 덮어씀).
            버튼은 2열로 펴고 둘 다 lg(56px) — 파괴적 확인에서 오조작이 가장 비싸다. */}
        <AlertDialogFooter className="m-0 grid grid-cols-2 gap-2 rounded-none border-0 bg-transparent p-0">
          <AlertDialogCancel variant="secondary" size="lg">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="lg"
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
