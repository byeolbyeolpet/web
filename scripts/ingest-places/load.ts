// places 배치 upsert + 폐업 전환 — service_role 클라이언트 (스펙 §4)
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/shared/lib/supabase/database.types";
import { SOURCE } from "./constants";
import type { PlaceUpsert } from "./transform";

// PostgREST 요청 크기·URL 길이를 고려한 경험적 상한. 실패하면 즉시 중단하고
// 원인을 본다 — 재실행이 안전하게 설계돼 있어 부분 적재는 문제가 아니다(스펙 §7).
const UPSERT_CHUNK = 500;
const CLOSED_CHUNK = 200;

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size));
  return out;
}

export function createServiceClient(url: string, serviceKey: string) {
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  });
}

type ServiceClient = ReturnType<typeof createServiceClient>;

export async function upsertPlaces(
  client: ServiceClient,
  rows: PlaceUpsert[],
): Promise<void> {
  for (const part of chunk(rows, UPSERT_CHUNK)) {
    const { error } = await client
      .from("places")
      .upsert(part, { onConflict: "source,external_id" });
    if (error)
      throw new Error(`upsert 실패 (${part.length}행 chunk): ${error.message}`);
  }
}

/** 원장에 이미 있는 장소만 closed 로 전환 — 없는 관리번호는 조용히 무시된다(스펙 §4-2). */
export async function markClosed(
  client: ServiceClient,
  externalIds: string[],
): Promise<void> {
  for (const part of chunk(externalIds, CLOSED_CHUNK)) {
    const { error } = await client
      .from("places")
      .update({ status: "closed" })
      .eq("source", SOURCE)
      .in("external_id", part);
    if (error) throw new Error(`closed 전환 실패: ${error.message}`);
  }
}
