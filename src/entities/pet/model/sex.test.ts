// 성별 라벨·선택지 검증 — 폼과 카드가 같은 정의를 쓰는지가 핵심이다.

import { describe, expect, it } from "vitest";
import { Constants } from "@/shared/lib/supabase/database.types";
import { PET_SEX_CHOICES, PET_SEX_LABEL } from "./sex";

describe("PET_SEX_LABEL", () => {
  it("DB enum 의 모든 값에 라벨이 있다", () => {
    expect(Object.keys(PET_SEX_LABEL).sort()).toEqual(
      [...Constants.public.Enums.pet_sex].sort(),
    );
  });

  it("종을 가리지 않는 표기를 쓴다 — 여아·남아는 개·고양이 쪽으로 기운 말이다", () => {
    expect(PET_SEX_LABEL.female).toBe("암컷");
    expect(PET_SEX_LABEL.male).toBe("수컷");
  });
});

describe("PET_SEX_CHOICES", () => {
  it("unknown 을 선택지로 내보이지 않는다 — 안 고르면 그 값이 저장된다", () => {
    expect(PET_SEX_CHOICES).not.toContain("unknown");
  });

  it("모든 선택지에 라벨이 있다", () => {
    for (const choice of PET_SEX_CHOICES) {
      expect(PET_SEX_LABEL[choice]).toBeTruthy();
    }
  });
});
