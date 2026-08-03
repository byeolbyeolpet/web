// CSV 행 → places upsert 행 / closed 마커 / 스킵 — 순수 함수 (스펙 §3·§4)
import proj4 from "proj4";
import {
  COLUMNS,
  EPSG_5174,
  KOREA_BOUNDS,
  SOURCE,
  STATUS_MAP,
  type PlaceCategory,
  type PlaceStatus,
} from "./constants";

export type PlaceUpsert = {
  source: string;
  external_id: string;
  category: PlaceCategory;
  status: Exclude<PlaceStatus, "closed">;
  name: string;
  road_address: string | null;
  jibun_address: string | null;
  phone: string | null;
  lat: number;
  lng: number;
};

export type SkipReason =
  | "missing_required"
  | "unknown_status"
  | "missing_coord"
  | "coord_out_of_bounds";

export type TransformResult =
  | { kind: "upsert"; row: PlaceUpsert }
  | { kind: "closed"; externalId: string }
  | { kind: "skip"; reason: SkipReason };

const toWgs84 = proj4(EPSG_5174, proj4.WGS84);

function emptyToNull(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

export function transformRow(
  record: Record<string, string>,
  category: PlaceCategory,
): TransformResult {
  const externalId = (record[COLUMNS.managementId] ?? "").trim();
  const name = (record[COLUMNS.name] ?? "").trim();
  if (!externalId || !name) return { kind: "skip", reason: "missing_required" };

  const status = STATUS_MAP[(record[COLUMNS.status] ?? "").trim()];
  if (!status) return { kind: "skip", reason: "unknown_status" };
  // 폐업·취소류는 신규로 넣지 않는다 — 원장에 이미 있으면 closed 로 전환만(스펙 §4-2).
  if (status === "closed") return { kind: "closed", externalId };

  const xRaw = (record[COLUMNS.x] ?? "").trim();
  const yRaw = (record[COLUMNS.y] ?? "").trim();
  const x = Number(xRaw);
  const y = Number(yRaw);
  if (!xRaw || !yRaw || !Number.isFinite(x) || !Number.isFinite(y)) {
    return { kind: "skip", reason: "missing_coord" };
  }

  const [lng, lat] = toWgs84.forward([x, y]);
  // DB check 는 세계 범위(±90/±180)뿐이다. geography 캐스트는 범위 초과를 조용히
  // wrap 하므로(supabase-convention §4) 한국 상자 검증은 여기서 해야 한다.
  if (
    lat < KOREA_BOUNDS.minLat ||
    lat > KOREA_BOUNDS.maxLat ||
    lng < KOREA_BOUNDS.minLng ||
    lng > KOREA_BOUNDS.maxLng
  ) {
    return { kind: "skip", reason: "coord_out_of_bounds" };
  }

  return {
    kind: "upsert",
    row: {
      source: SOURCE,
      external_id: externalId,
      category,
      status,
      name,
      road_address: emptyToNull(record[COLUMNS.roadAddress]),
      jibun_address: emptyToNull(record[COLUMNS.jibunAddress]),
      phone: emptyToNull(record[COLUMNS.phone]),
      lat,
      lng,
    },
  };
}
