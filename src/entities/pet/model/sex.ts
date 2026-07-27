// 펫 성별 표시 라벨 — 등록 폼의 선택지와 카드의 표기가 같은 정의를 쓴다.
//
// "여아·남아"가 아니라 "암컷·수컷"인 이유: 우리는 종을 가리지 않는다.
// 페럿·거북·도마뱀에 "여아"는 붙지 않는 말이고, 개·고양이 쪽으로 기운 표현이다.

import type { Enums } from "@/shared/lib/supabase/database.types";

export const PET_SEX_LABEL: Record<Enums<"pet_sex">, string> = {
  female: "암컷",
  male: "수컷",
  unknown: "모름",
};

// 폼이 보여줄 선택지. unknown 은 "고르지 않음"이지 고를 값이 아니다 —
// 안 고르면 DB 기본값(unknown)이 그대로 저장된다. 선택지로 내보이면
// 아무것도 안 한 사용자에게 "모름"이 선택된 것처럼 강조돼 보인다.
export const PET_SEX_CHOICES = [
  "female",
  "male",
] as const satisfies readonly Enums<"pet_sex">[];
