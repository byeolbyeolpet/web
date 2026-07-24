// 닉네임 수정 — 본인 행만 UPDATE 가능(RLS auth.uid() = id).
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createClient } from "@/shared/lib/supabase/client";

export function useUpdateNickname(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nickname: string) => {
      const { data, error } = await createClient()
        .from("profiles")
        .update({ nickname })
        .eq("id", userId!)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      // RLS 로 걸러지면 에러 없이 0행 반영이 된다 — 행이 안 돌아오면 실패로 간주한다.
      if (!data) throw new Error("nickname update: no row affected");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile.all });
      toast.success(APP_MESSAGE.profile.updateDone.title);
    },
    onError: (error) => {
      console.error(error);
      toast.error(APP_MESSAGE.profile.updateFailed.title, {
        description: APP_MESSAGE.profile.updateFailed.description,
      });
    },
  });
}
