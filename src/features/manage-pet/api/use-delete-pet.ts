// 펫 삭제 — RLS(pets_delete_own)가 auth.uid() = owner_id 를 강제한다.
//
// 되돌릴 수 없는 조작이라 호출부는 반드시 확인 단계를 거친다(DeletePetButton).
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { toastAppError, toastAppSuccess } from "@/shared/lib/app-toast";
import { createClient } from "@/shared/lib/supabase/client";

export function useDeletePet(petId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // delete 는 기본적으로 삭제된 행을 돌려주지 않는다. select 를 붙여
      // "정말 지워졌는지" 를 확인한다 — 남의 펫이면 RLS 가 에러 없이 0행을 준다.
      const { data, error } = await createClient()
        .from("pets")
        .delete()
        .eq("id", petId)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("pet delete: no row returned");
      return data;
    },
    onSuccess: () => {
      // 지워진 펫의 단건 캐시는 무효화가 아니라 제거다 — 다시 조회하면 404 다.
      queryClient.removeQueries({ queryKey: QUERY_KEYS.pet.detail(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pet.listAll() });
      toastAppSuccess(APP_MESSAGE_CODE.pet.deleteDone);
    },
    onError: (error) => toastAppError(APP_MESSAGE_CODE.pet.deleteFailed, error),
  });
}
