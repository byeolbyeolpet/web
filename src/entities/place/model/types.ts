// 장소 도메인 타입 — 생성 타입의 거짓말(RPC returns table 전 컬럼 non-null)을 복원한다.
// phone·road_address·jibun_address·external_id 는 실제 NULL 이 온다(supabase-convention §1).
import type { Database, Tables } from "@/shared/lib/supabase/database.types";

type NearbyRow =
  Database["public"]["Functions"]["nearby_places"]["Returns"][number];

export type NearbyPlace = Omit<
  NearbyRow,
  "external_id" | "road_address" | "jibun_address" | "phone"
> &
  Pick<
    Tables<"places">,
    "external_id" | "road_address" | "jibun_address" | "phone"
  >;

export type PlaceDetail = Pick<
  Tables<"places">,
  | "id"
  | "category"
  | "status"
  | "name"
  | "road_address"
  | "jibun_address"
  | "phone"
  | "lat"
  | "lng"
>;
