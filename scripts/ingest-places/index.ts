// CLI 진입점 — data/ 의 5개 파일을 parse→transform→load 하고 리포트를 찍는다(스펙 §5).
// 실행: npm run ingest:places  (.env.local 에 SUPABASE_SERVICE_ROLE_KEY 필요)
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { COLUMNS, SOURCE_FILES } from "./constants";
import { createServiceClient, markClosed, upsertPlaces } from "./load";
import { parseCsvFile } from "./parse";
import { transformRow, type PlaceUpsert, type SkipReason } from "./transform";

loadEnv({ path: resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 .env.local 에 필요하다.",
    );
  }
  const client = createServiceClient(url, serviceKey);

  for (const { file, category } of SOURCE_FILES) {
    const records = parseCsvFile(resolve(process.cwd(), "data", file));

    // 파일 단위 오류는 즉시 중단 — 잘못된 매핑으로 수만 행을 넣는 것이 최악이다(스펙 §7).
    const first = records[0];
    if (!first) throw new Error(`${file}: 빈 파일`);
    const missing = Object.values(COLUMNS).filter(
      (column) => !(column in first),
    );
    if (missing.length > 0) {
      throw new Error(`${file}: 헤더 불일치 — ${missing.join(", ")} 없음`);
    }

    const upserts: PlaceUpsert[] = [];
    const closed: string[] = [];
    const skips: Record<SkipReason, number> = {
      missing_required: 0,
      unknown_status: 0,
      missing_coord: 0,
      coord_out_of_bounds: 0,
    };
    // 같은 chunk 안에 중복 관리번호가 있으면 PostgREST upsert 가 통째로 죽는다 — 먼저 것만 남긴다.
    let duplicates = 0;
    const seen = new Set<string>();

    for (const record of records) {
      const result = transformRow(record, category);
      if (result.kind === "skip") {
        skips[result.reason] += 1;
      } else if (
        seen.has(
          result.kind === "upsert" ? result.row.external_id : result.externalId,
        )
      ) {
        duplicates += 1;
      } else if (result.kind === "upsert") {
        seen.add(result.row.external_id);
        upserts.push(result.row);
      } else {
        seen.add(result.externalId);
        closed.push(result.externalId);
      }
    }

    await upsertPlaces(client, upserts);
    await markClosed(client, closed);
    console.log(
      `[${category}] 총 ${records.length} → upsert ${upserts.length}, closed 마커 ${closed.length}, 중복 ${duplicates}, 스킵 ${JSON.stringify(skips)}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
