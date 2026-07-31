// 펫 등록 — PetForm 에 insert mutation 을 물린다.
"use client";

import { useRouter } from "next/navigation";
import { useCreatePet } from "../api/use-create-pet";
import { PetForm } from "./pet-form";

export function CreatePetForm({ ownerId }: { ownerId: string }) {
  const router = useRouter();
  const createPet = useCreatePet(ownerId);

  return (
    <PetForm
      submitLabel="등록하기"
      // 성공을 "끝났다"가 아니라 "이 화면을 떠난다"로 읽는다 — insert 가 끝나면
      // isPending 은 곧바로 false 지만 router.replace 는 그때부터 화면을 바꾼다.
      // 그 틈에 한 번 더 눌리면 펫이 두 마리 생긴다.
      isSubmitting={createPet.isPending || createPet.isSuccess}
      onSubmit={(values) =>
        createPet.mutate(values, { onSuccess: () => router.replace("/me") })
      }
    />
  );
}
