// 확인 대화상자 — 되돌릴 수 없는 조작 앞에서 한 번 멈춘다.
//
// 원본 AlertDialog 의 Header/Footer 골격을 쓰지 않고 Content 안을 직접 조립한다.
// 원본은 데스크톱 밀도다 — max-w-xs 창, 32px 버튼, footer 에 회색 띠 + 경계선,
// sm 이상에서 좌측 정렬로 튀는 반응형 규칙까지. 그 위에 className 으로 덧칠하며
// 싸우는 것보다 모바일 확인창 하나를 바로 그리는 편이 낫다.
//
//  - 중앙 정렬 한 가지 정렬만 갖는다(반응형으로 정렬이 바뀌지 않는다)
//  - tint 원형 아이콘이 "무슨 종류의 확인인지"를 색·모양으로 먼저 말한다
//  - 버튼은 56px 2열: 취소(secondary) · 확인(단색 destructive)
//  - 문구는 APP_MESSAGE 코드로만 받는다(ErrorState 와 같은 규칙)
//
// 확인 버튼이 단색인 이유: 이 창의 주인공 행동은 "확인"이고, tint 버튼은 본문
// 속 부차 행동의 무게다. 흰 글씨 대비는 라이트 4.83:1(#dc2626)·다크는 어두운
// 글씨(#2a0a0a on #f87171)로 둘 다 AA 통과 — axe 가 실측한다.
//
// AlertDialog(Dialog 가 아니라)인 이유: 바깥 클릭·ESC 로 닫히지 않고 포커스가
// 취소에서 시작한다. 파괴적 조작에서 "실수로 확인"을 막는 장치다.
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
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";

const TONE = {
  destructive: {
    Icon: LuTrash2,
    circle: "bg-destructive/10 text-destructive-emphasis",
    action:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  warning: {
    Icon: LuTriangleAlert,
    circle: "bg-warning/10 text-warning",
    action: "bg-warning text-warning-foreground hover:bg-warning/90",
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
  const { Icon, circle, action } = TONE[tone];

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

      <AlertDialogContent
        className={cn(
          // 원본의 grid gap 을 끄고(gap-0) 간격은 아래에서 직접 준다.
          // 폭은 좌우 24px 여백, 위는 여유 있게 — 아이콘이 창의 얼굴이다.
          "w-[calc(100%-3rem)] max-w-sm gap-0 rounded-3xl p-6 pt-8 text-center",
        )}
      >
        {/* 색만으로 전달하지 않는다 — 아이콘 모양이 종류를 먼저 말한다. */}
        <div
          className={cn(
            "mx-auto flex size-16 items-center justify-center rounded-full",
            circle,
          )}
        >
          <Icon aria-hidden className="size-7" />
        </div>

        <AlertDialogTitle className="mt-4 font-heading text-lg font-bold">
          {message.title}
        </AlertDialogTitle>
        {message.description && (
          <AlertDialogDescription className="mt-1.5 text-sm break-keep text-muted-foreground">
            {message.description}
          </AlertDialogDescription>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <AlertDialogCancel
            variant="secondary"
            size="lg"
            className="rounded-xl"
          >
            {cancelLabel}
          </AlertDialogCancel>
          {/* Button 의 destructive 변형은 tint(부차 행동의 무게)라 여기선 단색으로
              덮는다. cn 병합이라 bg·text·hover 만 갈린다. */}
          <AlertDialogAction
            size="lg"
            className={cn("rounded-xl", action)}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
