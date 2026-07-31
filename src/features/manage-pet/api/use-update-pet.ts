// 펫 수정 — RLS(pets_update_own)가 auth.uid() = owner_id 를 강제한다.
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { toastAppError, toastAppSuccess } from "@/shared/lib/app-toast";
import { createClient } from "@/shared/lib/supabase/client";
import type { PetFormValues } from "../model/schema";

export function useUpdatePet(petId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: PetFormValues) => {
      const { data, error } = await createClient()
        .from("pets")
        .update({
          name: values.name,
          species_code: values.speciesCode,
          sex: values.sex,
        })
        .eq("id", petId)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      // 남의 펫이면 RLS 가 에러 없이 0행으로 거른다 — 성공으로 읽으면 안 된다.
      if (!data) throw new Error("pet update: no row returned");
      return data;
    },
    onSuccess: () => {
      // 목록과 단건 둘 다 낡는다. pet.all 로 한 번에 턴다.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pet.all });
      toastAppSuccess(APP_MESSAGE_CODE.pet.updateDone);
    },
    onError: (error) => toastAppError(APP_MESSAGE_CODE.pet.updateFailed, error),
  });
}
