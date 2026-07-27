// 펫 성별 표시 라벨 — 등록 폼의 선택지와 카드의 표기가 같은 정의를 쓴다.
// 순서는 선언 순서 그대로 폼 선택지 순서가 된다.

import type { Enums } from "@/shared/lib/supabase/database.types";

export const PET_SEX_LABEL: Record<Enums<"pet_sex">, string> = {
  female: "여아",
  male: "남아",
  unknown: "모름",
};
