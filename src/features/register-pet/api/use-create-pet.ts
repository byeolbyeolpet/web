// 펫 등록 — owner_id 는 세션에서 받는다. RLS 가 auth.uid() = owner_id 를 강제한다.
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createClient } from "@/shared/lib/supabase/client";
import type { PetFormValues } from "../model/schema";

export function useCreatePet(ownerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: PetFormValues) => {
      const { data, error } = await createClient()
        .from("pets")
        .insert({
          owner_id: ownerId,
          name: values.name,
          species_code: values.speciesCode,
          sex: values.sex,
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      // RLS 로 걸러지면 에러 없이 0행이 된다 — 행이 안 돌아오면 실패로 간주한다.
      if (!data) throw new Error("pet insert: no row returned");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pet.all });
      toast.success(APP_MESSAGE.pet.createDone.title);
    },
    onError: (error) => {
      console.error(error);
      toast.error(APP_MESSAGE.pet.createFailed.title, {
        description: APP_MESSAGE.pet.createFailed.description,
      });
    },
  });
}
