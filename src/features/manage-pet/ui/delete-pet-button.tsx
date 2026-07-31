// 펫 삭제 버튼 — 되돌릴 수 없으므로 확인 대화상자를 한 번 거친다.
//
// 확인 UI 는 shared/ui 의 ConfirmDialog 를 쓴다. AlertDialog(Dialog 가 아니라)를
// 쓰는 이유는 바깥 클릭·ESC 로 닫히지 않고 포커스가 취소에서 시작하기 때문이다 —
// 파괴적 조작에서 "실수로 확인" 을 막는 장치다.
"use client";

import { LuTrash2 } from "react-icons/lu";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useDeletePet } from "../api/use-delete-pet";

export function DeletePetButton({
  petId,
  onDeleted,
}: {
  petId: string;
  onDeleted: () => void;
}) {
  const deletePet = useDeletePet(petId);
  // 성공 후에도 잠근 채로 둔다 — 화면 전환이 시작되기 전에 다시 눌리면
  // 이미 없는 행에 delete 가 한 번 더 나간다.
  const isLeaving = deletePet.isPending || deletePet.isSuccess;

  return (
    <ConfirmDialog
      code={APP_MESSAGE_CODE.pet.deleteConfirm}
      confirmLabel="삭제"
      onConfirm={() => deletePet.mutate(undefined, { onSuccess: onDeleted })}
      trigger={
        // 저장 CTA 와 나란히 두지 않는다. 면(bg)을 쓰지 않아 무게를 낮추고,
        // 색만으로 전달하지 않도록 아이콘을 함께 둔다(CLAUDE.md).
        <Button
          type="button"
          variant="destructive"
          size="lg"
          className="w-full"
          loading={isLeaving}
        >
          {!isLeaving && <LuTrash2 aria-hidden />}
          삭제하기
        </Button>
      }
    />
  );
}
