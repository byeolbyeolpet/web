// 수집 파이프라인 고정 상수 — 파일→카테고리, CSV 헤더, 영업상태 매핑, 좌표계 (스펙 §3 실측)
import type { Database } from "../../src/shared/lib/supabase/database.types";

export type PlaceCategory = Database["public"]["Enums"]["place_category"];
export type PlaceStatus = Database["public"]["Enums"]["place_status"];

/** 입력 파일 → 카테고리. data/ 는 gitignore — 파일명은 공공데이터포털 다운로드 원본 그대로. */
export const SOURCE_FILES: ReadonlyArray<{
  file: string;
  category: PlaceCategory;
}> = [
  { file: "동물_동물병원.csv", category: "animal_hospital" },
  { file: "동물_동물미용업.csv", category: "grooming" },
  { file: "동물_동물위탁관리업.csv", category: "boarding" },
  { file: "동물_동물약국.csv", category: "pharmacy" },
  { file: "동물_동물장묘업.csv", category: "funeral" },
];

/** CSV 헤더 이름(2026-08-03 실측). 업종별 컬럼 수가 25~26으로 달라 위치가 아니라 이름으로 찾는다. */
export const COLUMNS = {
  managementId: "관리번호",
  name: "사업장명",
  roadAddress: "도로명주소",
  jibunAddress: "지번주소",
  phone: "전화번호",
  x: "좌표정보(X)",
  y: "좌표정보(Y)",
  status: "영업상태명",
} as const;

/** 영업상태명 → place_status. 여기 없는 값은 스킵 — 조용히 operating 이 되지 않게(스펙 §3-1). */
export const STATUS_MAP: Readonly<Record<string, PlaceStatus>> = {
  "영업/정상": "operating",
  휴업: "suspended",
  폐업: "closed",
  "취소/말소/만료/정지/중지": "closed",
};

/** EPSG:5174 — 보정 중부원점TM(Bessel). 지방행정 인허가 데이터 좌표계. */
export const EPSG_5174 =
  "+proj=tmerc +lat_0=38 +lon_0=127.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43";

/** 변환 결과 검증용 한국 상자(스펙 §3-2). 밖이면 변환 오류로 보고 스킵한다. */
export const KOREA_BOUNDS = {
  minLat: 33,
  maxLat: 39,
  minLng: 124,
  maxLng: 132,
} as const;

export const SOURCE = "localdata";
