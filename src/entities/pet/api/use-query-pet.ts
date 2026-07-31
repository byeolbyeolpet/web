// 펫 단건 조회 — 수정 화면이 기존 값을 채우는 데 쓴다.
//
// 목록 캐시에서 꺼내 쓰지 않는다. 수정 화면은 딥링크로 바로 열릴 수 있고
// (앱스킴://pet/edit?id=...), 그때는 목록을 한 번도 조회한 적이 없다.
"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createClient } from "@/shared/lib/supabase/client";

export function useQueryPet(petId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.pet.detail(petId),
    enabled: Boolean(petId),
    queryFn: async () => {
      // 목록과 같은 필드를 고른다 — 수정 폼이 채워야 하는 값이 그대로 이것들이다.
      // owner_id 는 화면이 "내 펫인지" 를 가리는 데 쓴다(pets 는 읽기 공개다).
      const { data, error } = await createClient()
        .from("pets")
        .select("id, name, sex, species_code, owner_id")
        .eq("id", petId!)
        .maybeSingle();
      if (error) {
        console.error("[pet] 단건 조회 실패", error);
        throw error;
      }
      // 없는 id 는 에러가 아니라 null 로 돌린다. throw 하면 TanStack 이 재시도를
      // 세 번 하는데, 없는 행은 다시 물어봐도 없다.
      return data;
    },
  });
}

export type PetDetail = NonNullable<ReturnType<typeof useQueryPet>["data"]>;
