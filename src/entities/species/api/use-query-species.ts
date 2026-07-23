// 종 목록 조회 — 펫 등록·장소 태깅(해자)·필터가 공통으로 쓰는 기준 데이터.
"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createClient } from "@/shared/lib/supabase/client";
import type { Enums, Tables } from "@/shared/lib/supabase/database.types";

export type Species = Tables<"species">;

/**
 * 종 목록을 가져온다. `group` 을 주면 해당 그룹만 (예: 'exotic' = 특수동물).
 * species 는 읽기 공개라 비로그인 상태에서도 조회된다.
 */
export function useQuerySpecies(group?: Enums<"species_group">) {
  return useQuery({
    queryKey: QUERY_KEYS.species.list(group),
    queryFn: async (): Promise<Species[]> => {
      const supabase = createClient();

      // 그룹 필터도 정렬도 DB 에서 건다. 받아와서 클라이언트에서 거르거나 정렬하지 않는다.
      // sort_order 는 노출 순서를 데이터로 가진 컬럼이다 — 가나다순이면 가장 흔한
      // 특수동물(토끼·햄스터)이 맨 아래로 밀린다.
      let query = supabase.from("species").select("*").order("sort_order");
      if (group) query = query.eq("group", group);

      const { data, error } = await query;
      // 원본 에러는 로그로만 남기고 사용자에게는 노출하지 않는다.
      // PostgrestError 의 hint 에 실제 원인이 담기는 경우가 많아 객체 전체를 찍는다.
      if (error) {
        console.error(error);
        throw error;
      }
      return data;
    },
    // 종 목록은 거의 변하지 않는 기준 데이터라 기본 staleTime(60초)보다 길게 잡는다.
    staleTime: 1000 * 60 * 60,
  });
}
