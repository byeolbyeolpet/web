// 프로필 단건 조회 — profiles 는 RLS 로 본인 행만 읽히는 개인화 데이터.
"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createClient } from "@/shared/lib/supabase/client";
import type { Tables } from "@/shared/lib/supabase/database.types";

export type Profile = Tables<"profiles">;

export function useQueryProfile(userId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.profile.detail(userId),
    // 세션이 확정되기 전에는 묻지 않는다 — userId 없이 부르면 RLS 로 빈 결과만 온다.
    enabled: !!userId,
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await createClient()
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .single();
      if (error) {
        console.error(error);
        throw error;
      }
      return data;
    },
  });
}
