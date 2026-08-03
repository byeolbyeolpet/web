// 장소 단건 — 단순 select 라 RPC 로 감싸지 않는다(supabase-convention §3-4).
"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createClient } from "@/shared/lib/supabase/client";

export function useQueryPlace(placeId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.place.detail(placeId),
    enabled: Boolean(placeId),
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("places")
        .select(
          "id, category, status, name, road_address, jibun_address, phone, lat, lng",
        )
        .eq("id", placeId!)
        .maybeSingle();
      if (error) {
        console.error("[place] 단건 조회 실패", error);
        throw error;
      }
      return data; // null = 없는 장소 — 화면이 notFound 로 처리
    },
  });
}
