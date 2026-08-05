// 반경 내 장소 — nearby_places RPC. 상태 필터는 RPC 기본(operating만)을 쓴다.
"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createClient } from "@/shared/lib/supabase/client";
import type { PlaceCategory } from "../model/category";
import type { NearbyPlace } from "../model/types";

export type NearbySearchParams = {
  lat: number;
  lng: number;
  radiusM: number;
  category: PlaceCategory | null;
};

/**
 * 한 번에 받아오는 최대 건수. RPC 가 거리순으로 자르고, 500 을 넘기면 다시 clamp 한다.
 * 상한이 없으면 반경 20km 에서 8,529행이 그대로 내려온다(서울시청 실측).
 * 호출부는 결과 길이가 이 값과 같으면 "더 있다"로 읽는다.
 */
export const NEARBY_LIMIT = 200;

export function useQueryNearbyPlaces(params: NearbySearchParams | null) {
  return useQuery({
    queryKey: QUERY_KEYS.place.nearby(params ?? undefined),
    enabled: params !== null,
    queryFn: async (): Promise<NearbyPlace[]> => {
      const { data, error } = await createClient().rpc("nearby_places", {
        p_lat: params!.lat,
        p_lng: params!.lng,
        p_radius_m: Math.round(params!.radiusM),
        p_limit: NEARBY_LIMIT,
        ...(params!.category ? { p_category: params!.category } : {}),
      });
      if (error) {
        console.error("[place] 주변 장소 조회 실패", error);
        throw error;
      }
      return data as NearbyPlace[];
    },
  });
}
