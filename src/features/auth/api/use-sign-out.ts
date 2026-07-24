// 로그아웃 — 세션 제거 후 개인화 캐시(profile)를 비운다.
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createClient } from "@/shared/lib/supabase/client";

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      // 다음 로그인 계정의 프로필이 이전 캐시로 보이면 안 된다 — 무효화가 아니라 제거.
      queryClient.removeQueries({ queryKey: QUERY_KEYS.profile.all });
    },
    onError: (error) => {
      console.error(error);
      toast.error(APP_MESSAGE.auth.signOutFailed.title, {
        description: APP_MESSAGE.auth.signOutFailed.description,
      });
    },
  });
}
