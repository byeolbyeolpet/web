// 내 펫 목록 — 소유자 기준. pets 는 읽기 공개지만 이 목록은 본인 것만 본다.
"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createClient } from "@/shared/lib/supabase/client";

export function useQueryPets(ownerId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.pet.listByOwner(ownerId),
    enabled: Boolean(ownerId),
    queryFn: async () => {
      // 종 이름은 조인해서 한 번에 받는다 — 목록마다 종을 다시 조회하지 않는다.
      const { data, error } = await createClient()
        .from("pets")
        .select("id, name, sex, species (code, name_ko)")
        .eq("owner_id", ownerId!)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[pet] 목록 조회 실패", error);
        throw error;
      }
      return data;
    },
  });
}

export type PetListItem = NonNullable<
  ReturnType<typeof useQueryPets>["data"]
>[number];
