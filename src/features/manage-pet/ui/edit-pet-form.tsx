// 펫 수정 — PetForm 에 update mutation 을 물리고, 아래에 삭제를 붙인다.
"use client";

import { useRouter } from "next/navigation";
import type { PetDetail } from "@/entities/pet";
import { useUpdatePet } from "../api/use-update-pet";
import { DeletePetButton } from "./delete-pet-button";
import { PetForm } from "./pet-form";

export function EditPetForm({ pet }: { pet: PetDetail }) {
  const router = useRouter();
  const updatePet = useUpdatePet(pet.id);

  // 수정·삭제 모두 끝나면 마이로 돌아간다. push 가 아니라 replace 다 —
  // 뒤로가기로 방금 지운 펫의 수정 화면에 되돌아가면 안 된다.
  const backToMe = () => router.replace("/me");

  return (
    <PetForm
      defaultValues={{
        name: pet.name,
        speciesCode: pet.species_code,
        sex: pet.sex,
      }}
      submitLabel="저장하기"
      isSubmitting={updatePet.isPending || updatePet.isSuccess}
      onSubmit={(values) => updatePet.mutate(values, { onSuccess: backToMe })}
      footer={<DeletePetButton petId={pet.id} onDeleted={backToMe} />}
    />
  );
}
