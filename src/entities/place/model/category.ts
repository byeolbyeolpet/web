// 장소 카테고리 상수 — 라벨·마커색·핀 글리프·아이콘·칩 클래스 (스펙 §2)
// 마커색은 항상 라이트 지도 위라 라이트 고정값. UI(칩·글자)는 CSS 토큰(place-*)을 쓴다.
import type { IconType } from "react-icons";
import {
  LuBedDouble,
  LuCross,
  LuFlower2,
  LuPill,
  LuScissors,
} from "react-icons/lu";
import type { Enums } from "@/shared/lib/supabase/database.types";

export type PlaceCategory = Enums<"place_category">;

type CategoryEntry = {
  label: string;
  markerColor: string;
  /** 핀 안에 넣는 한 글자 — SVG 에 아이콘 폰트를 못 실어 한글 글리프로 병행 표기 */
  glyph: string;
  Icon: IconType;
  /** Tailwind JIT 는 리터럴만 인식 — 동적 조립 금지.
   *  글자는 면색이 아니라 `-emphasis` 다 — 면색 그대로는 라이트에서 AA 미달. */
  chipClass: string;
};

export const PLACE_CATEGORY: Record<PlaceCategory, CategoryEntry> = {
  animal_hospital: {
    label: "병원",
    markerColor: "#e5484d",
    glyph: "병",
    Icon: LuCross,
    chipClass: "text-place-hospital-emphasis bg-place-hospital/10",
  },
  grooming: {
    label: "미용",
    markerColor: "#d6409f",
    glyph: "미",
    Icon: LuScissors,
    chipClass: "text-place-grooming-emphasis bg-place-grooming/10",
  },
  boarding: {
    label: "호텔",
    markerColor: "#0091ff",
    glyph: "호",
    Icon: LuBedDouble,
    chipClass: "text-place-boarding-emphasis bg-place-boarding/10",
  },
  pharmacy: {
    label: "약국",
    markerColor: "#30a46c",
    glyph: "약",
    Icon: LuPill,
    chipClass: "text-place-pharmacy-emphasis bg-place-pharmacy/10",
  },
  funeral: {
    label: "장묘",
    markerColor: "#7e808a",
    glyph: "장",
    Icon: LuFlower2,
    chipClass: "text-place-funeral-emphasis bg-place-funeral/10",
  },
};

/** DB enum 선언 순서 그대로의 목록 — 칩 열·범례가 쓴다 */
export const PLACE_CATEGORY_LIST = (
  ["animal_hospital", "grooming", "boarding", "pharmacy", "funeral"] as const
).map((code) => ({ code, ...PLACE_CATEGORY[code] }));
