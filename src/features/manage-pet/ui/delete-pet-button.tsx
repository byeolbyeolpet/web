// 펫 삭제 버튼 — 되돌릴 수 없으므로 AlertDialog 로 한 번 멈춘다.
//
// Dialog 가 아니라 AlertDialog 인 이유: 바깥 클릭·ESC 로 닫히지 않고 포커스가
// 취소 버튼에서 시작한다. 파괴적 조작에서 "실수로 확인" 을 막는 장치다.
"use client";

import { LuTrash2 } from "react-icons/lu";
import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { Button } from "@/shared/ui/button";
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
import { useDeletePet } from "../api/use-delete-pet";

const CONFIRM = APP_MESSAGE[APP_MESSAGE_CODE.pet.deleteConfirm];

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
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {/* 저장 CTA 와 나란히 두지 않는다. 면(bg)을 쓰지 않아 무게를 낮추고,
            색만으로 전달하지 않도록 아이콘을 함께 둔다(CLAUDE.md). */}
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
      </AlertDialogTrigger>

      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{CONFIRM.title}</AlertDialogTitle>
          <AlertDialogDescription>{CONFIRM.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          {/* onSelect 로 기본 닫힘을 막지 않는다 — 확인 즉시 닫고, 결과는
              toast 와 화면 전환이 알린다. 창을 열어둔 채 스피너를 돌리면
              사용자가 두 번 누를 여지가 생긴다. */}
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              deletePet.mutate(undefined, { onSuccess: onDeleted })
            }
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
