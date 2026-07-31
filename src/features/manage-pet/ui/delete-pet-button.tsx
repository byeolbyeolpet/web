// 펫 삭제 버튼(표시 전용) — 되돌릴 수 없으므로 확인 대화상자를 한 번 거친다.
//
// mutation 을 직접 만들지 않는다 — EditPetForm 이 삭제 mutation 을 쥔다.
// 삭제가 진행되는 동안 저장 버튼도 함께 잠가야 하는데(지워지는 행에 update 가
// 나가면 안 된다), mutation 이 여기 갇혀 있으면 폼이 그 상태를 알 수 없다
// (CodeRabbit 지적).
//
// 확인 UI 는 shared/ui 의 ConfirmDialog 를 쓴다. AlertDialog(Dialog 가 아니라)를
// 쓰는 이유는 바깥 클릭·ESC 로 닫히지 않고 포커스가 취소에서 시작하기 때문이다 —
// 파괴적 조작에서 "실수로 확인" 을 막는 장치다.
"use client";

import { LuTrash2 } from "react-icons/lu";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

export function DeletePetButton({
  loading,
  onConfirm,
}: {
  /** 삭제 진행·성공(화면 전환 중) 동안 true — 부모의 mutation 상태를 그대로 받는다. */
  loading: boolean;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      code={APP_MESSAGE_CODE.pet.deleteConfirm}
      confirmLabel="삭제"
      onConfirm={onConfirm}
      trigger={
        // 저장 CTA 와 나란히 두지 않는다. 면(bg)을 쓰지 않아 무게를 낮추고,
        // 색만으로 전달하지 않도록 아이콘을 함께 둔다(CLAUDE.md).
        <Button
          type="button"
          variant="destructive"
          size="lg"
          className="w-full"
          loading={loading}
        >
          {!loading && <LuTrash2 aria-hidden />}
          삭제하기
        </Button>
      }
    />
  );
}
