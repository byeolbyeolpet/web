# 장소 원장 시딩 (#44) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공공데이터포털 인허가 CSV 5개(병원·미용·위탁·약국·장묘)를 정제해 `places`를 시딩하는 재실행 가능한 로컬 파이프라인.

**Architecture:** `scripts/ingest-places/`의 단일 책임 모듈 4개(parse→transform→load, index가 조립). transform은 순수 함수로 TDD. 적재는 `on conflict (source, external_id)` upsert + 기존 행 폐업 전환(2단계, 스펙 §4-2). 사전 작업으로 `place_category` enum에 `pharmacy`·`funeral`를 단독 마이그레이션으로 추가.

**Tech Stack:** tsx(스크립트 실행), iconv-lite(cp949), csv-parse(파싱), proj4(EPSG:5174→WGS84), @supabase/supabase-js(service_role upsert), vitest(단위 테스트).

**전제**: 스펙 [docs/specs/2026-08-03-place-ingest-design.md](../specs/2026-08-03-place-ingest-design.md). 원본 CSV 5개가 `data/`(gitignore됨)에 있다. 실행 계정 준비물 — `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY`(지호님이 대시보드에서 발급).

---

### Task 1: `place_category` enum 확장 — 단독 마이그레이션

**Files:**
- Create: `supabase/migrations/<원격version>_place_category_add_pharmacy_funeral.sql`
- Modify: `src/shared/lib/supabase/database.types.ts` (2곳)

- [ ] **Step 1: MCP `apply_migration`으로 원격 적용**

이름 `place_category_add_pharmacy_funeral`, 쿼리:

```sql
-- place_category 확장(#44) — 약국(pharmacy)·장묘(funeral).
-- enum 값 추가는 같은 트랜잭션에서 그 값을 쓸 수 없어 단독 마이그레이션으로 분리한다(supabase-convention §2).
alter type public.place_category add value if not exists 'pharmacy';
alter type public.place_category add value if not exists 'funeral';
```

- [ ] **Step 2: `list_migrations`로 원격 version 확인 → 같은 내용의 파일 생성**

파일명 버전은 손으로 만들지 않는다 — 원격이 기록한 version 그대로(supabase-convention §2).

- [ ] **Step 3: `execute_sql`로 enum 값 실측 확인**

```sql
select enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid
where t.typname = 'place_category' order by enumsortorder;
```

Expected: `animal_hospital, grooming, boarding, pharmacy, funeral`

- [ ] **Step 4: `database.types.ts` 갱신 (2곳)**

MCP `generate_typescript_types` 결과와 대조해 두 곳을 수정한다 (1행 한국어 헤더 주석은 유지 — supabase-convention §1):

```ts
// Enums 블록:
place_category: "animal_hospital" | "grooming" | "boarding" | "pharmacy" | "funeral"
// Constants.public.Enums 블록:
place_category: ["animal_hospital", "grooming", "boarding", "pharmacy", "funeral"],
```

- [ ] **Step 5: 빌드로 소비처 파급 확인**

Run: `npm run build`
Expected: 통과 (place_category 소비처는 아직 생성 타입뿐)

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/*_place_category_add_pharmacy_funeral.sql src/shared/lib/supabase/database.types.ts
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#44): place_category에 pharmacy·funeral 추가 — 단독 마이그레이션/Claude"
```

---

### Task 2: 도구 의존성 + 실행 환경

**Files:**
- Modify: `package.json` (devDependencies, scripts)
- Modify: `vitest.config.ts:14` (include)

- [ ] **Step 1: devDependencies 설치**

```bash
npm install -D tsx iconv-lite csv-parse proj4 @types/proj4
```

- [ ] **Step 2: `package.json` scripts에 추가**

```json
"ingest:places": "tsx scripts/ingest-places/index.ts"
```

- [ ] **Step 3: vitest include 확장**

```ts
// 단위/컴포넌트 테스트만. E2E(e2e/*.spec.ts)는 Playwright가 맡는다.
include: ["src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.{test,spec}.ts"],
```

- [ ] **Step 4: 기존 테스트 회귀 확인**

Run: `npm run test`
Expected: 89 passed (기존 그대로)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit --author="Claude <noreply@anthropic.com>" -m "chore(#44): 수집 스크립트 도구 — tsx·iconv-lite·csv-parse·proj4/Claude"
```

---

### Task 3: `constants.ts` — 실측 상수 고정

**Files:**
- Create: `scripts/ingest-places/constants.ts`

- [ ] **Step 1: 파일 작성** (실측값은 스펙 §2·§3 — 2026-08-03)

```ts
// 수집 파이프라인 고정 상수 — 파일→카테고리, CSV 헤더, 영업상태 매핑, 좌표계 (스펙 §3 실측)
import type { Database } from "../../src/shared/lib/supabase/database.types";

export type PlaceCategory = Database["public"]["Enums"]["place_category"];
export type PlaceStatus = Database["public"]["Enums"]["place_status"];

/** 입력 파일 → 카테고리. data/ 는 gitignore — 파일명은 공공데이터포털 다운로드 원본 그대로. */
export const SOURCE_FILES: ReadonlyArray<{ file: string; category: PlaceCategory }> = [
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
export const KOREA_BOUNDS = { minLat: 33, maxLat: 39, minLng: 124, maxLng: 132 } as const;

export const SOURCE = "localdata";
```

- [ ] **Step 2: 타입체크**

Run: `npm run typecheck`
Expected: 통과 (tsconfig include가 `**/*.ts`라 scripts/ 도 검사된다 — 실측 확인됨)

- [ ] **Step 3: Commit**

```bash
git add scripts/ingest-places/constants.ts
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#44): 수집 상수 — 실측 헤더·영업상태 매핑·EPSG:5174/Claude"
```

---

### Task 4: `transform.ts` — 순수 변환 함수 (TDD)

**Files:**
- Test: `scripts/ingest-places/transform.test.ts`
- Create: `scripts/ingest-places/transform.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// transform 단위 테스트 — 좌표 변환 앵커·상태 매핑·스킵 사유 (스펙 §3)
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { transformRow } from "./transform";

/** 유효한 영업 중 행. 좌표는 EPSG:5174 원점(x_0=200000, y_0=500000) = lat 38 / lng 127.0029 부근. */
function record(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    관리번호: "3220000-곧은-2026-0001",
    사업장명: "별별동물병원",
    도로명주소: "서울특별시 어딘가로 1",
    지번주소: "서울특별시 어딘가동 1",
    전화번호: "02-000-0000",
    "좌표정보(X)": "200000",
    "좌표정보(Y)": "500000",
    영업상태명: "영업/정상",
    ...overrides,
  };
}

describe("transformRow", () => {
  it("영업 행을 upsert 행으로 바꾸고 좌표를 WGS84로 변환한다 (원점 앵커)", () => {
    const result = transformRow(record(), "animal_hospital");
    expect(result.kind).toBe("upsert");
    if (result.kind !== "upsert") return;
    // EPSG:5174 정의상 투영 원점(200000, 500000)은 lat_0=38 / lon_0=127.00289.
    // towgs84 데이텀 보정으로 수백 m 이동하므로 소수 1자리 근사로 잡는다.
    expect(result.row.lat).toBeCloseTo(38.0, 1);
    expect(result.row.lng).toBeCloseTo(127.0029, 1);
    expect(result.row).toMatchObject({
      source: "localdata",
      external_id: "3220000-곧은-2026-0001",
      category: "animal_hospital",
      status: "operating",
      name: "별별동물병원",
    });
  });

  it("휴업은 suspended 로 매핑한다", () => {
    const result = transformRow(record({ 영업상태명: "휴업" }), "grooming");
    expect(result.kind).toBe("upsert");
    if (result.kind === "upsert") expect(result.row.status).toBe("suspended");
  });

  it.each(["폐업", "취소/말소/만료/정지/중지"])(
    "%s 는 closed 마커가 된다 — 신규로 넣지 않고 기존 행만 전환(스펙 §4-2)",
    (status) => {
      const result = transformRow(record({ 영업상태명: status }), "pharmacy");
      expect(result).toEqual({ kind: "closed", externalId: "3220000-곧은-2026-0001" });
    },
  );

  it("미지의 영업상태는 조용히 operating 이 되지 않고 스킵된다", () => {
    const result = transformRow(record({ 영업상태명: "듣도보도못한상태" }), "funeral");
    expect(result).toEqual({ kind: "skip", reason: "unknown_status" });
  });

  it("빈 영업상태도 스킵된다", () => {
    expect(transformRow(record({ 영업상태명: "" }), "funeral")).toEqual({
      kind: "skip",
      reason: "unknown_status",
    });
  });

  it("좌표 결측·비수치는 스킵된다", () => {
    expect(transformRow(record({ "좌표정보(X)": "" }), "boarding")).toEqual({
      kind: "skip",
      reason: "missing_coord",
    });
    expect(transformRow(record({ "좌표정보(Y)": "abc" }), "boarding")).toEqual({
      kind: "skip",
      reason: "missing_coord",
    });
  });

  it("변환 결과가 한국 상자 밖이면 변환 오류로 스킵된다", () => {
    // y=2,000,000m 는 원점에서 북쪽으로 1,500km — 위도가 39를 훌쩍 넘는다.
    const result = transformRow(record({ "좌표정보(Y)": "2000000" }), "boarding");
    expect(result).toEqual({ kind: "skip", reason: "coord_out_of_bounds" });
  });

  it("관리번호·사업장명 결측은 스킵된다", () => {
    expect(transformRow(record({ 관리번호: " " }), "boarding")).toEqual({
      kind: "skip",
      reason: "missing_required",
    });
    expect(transformRow(record({ 사업장명: "" }), "boarding")).toEqual({
      kind: "skip",
      reason: "missing_required",
    });
  });

  it("빈 주소·전화는 null 로 정규화한다", () => {
    const result = transformRow(record({ 도로명주소: " ", 전화번호: "" }), "animal_hospital");
    expect(result.kind).toBe("upsert");
    if (result.kind === "upsert") {
      expect(result.row.road_address).toBeNull();
      expect(result.row.phone).toBeNull();
    }
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run scripts/ingest-places/transform.test.ts`
Expected: FAIL — `Cannot find module './transform'`

- [ ] **Step 3: 구현**

```ts
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
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run scripts/ingest-places/transform.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/ingest-places/transform.ts scripts/ingest-places/transform.test.ts
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#44): transform — 좌표 변환·상태 매핑·스킵 사유 (TDD)/Claude"
```

---

### Task 5: `parse.ts` — cp949 CSV 파싱 (TDD)

**Files:**
- Test: `scripts/ingest-places/parse.test.ts`
- Create: `scripts/ingest-places/parse.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

픽스처 파일 대신 **테스트 안에서 cp949 버퍼를 만들어** 넣는다 — cp949 바이너리를 저장소에 커밋하지 않으면서 실제 인코딩 경로를 검증한다(스펙 §2·§5의 "샘플 공개" 의도는 이 테스트가 문서 역할로 대신한다).

```ts
// parse 단위 테스트 — cp949 디코드 + 헤더 키 파싱 (스펙 §2)
// @vitest-environment node
import { encode } from "iconv-lite";
import { describe, expect, it } from "vitest";
import { parseCsvBuffer } from "./parse";

describe("parseCsvBuffer", () => {
  it("cp949 CSV 를 헤더 키 객체로 파싱한다", () => {
    const csv = "관리번호,사업장명,영업상태명\r\n3220000-1,별별동물병원,영업/정상\r\n";
    const rows = parseCsvBuffer(encode(csv, "cp949"));
    expect(rows).toEqual([
      { 관리번호: "3220000-1", 사업장명: "별별동물병원", 영업상태명: "영업/정상" },
    ]);
  });

  it("UTF-8 BOM 파일도 처리한다 — 갱신본 인코딩이 바뀌는 경우의 안전망", () => {
    // BOM 은 보이지 않아 리터럴로 넣으면 리뷰가 불가능하다 — 이스케이프로 명시한다.
    const csv = "\uFEFF관리번호,사업장명\r\n3220000-2,별별약국\r\n";
    const rows = parseCsvBuffer(Buffer.from(csv, "utf-8"));
    expect(rows).toEqual([{ 관리번호: "3220000-2", 사업장명: "별별약국" }]);
  });

  it("따옴표 안의 쉼표를 필드로 쪼개지 않는다", () => {
    const csv = '관리번호,사업장명\r\n3220000-3,"별별펫, 토탈케어"\r\n';
    const rows = parseCsvBuffer(encode(csv, "cp949"));
    expect(rows[0]?.["사업장명"]).toBe("별별펫, 토탈케어");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run scripts/ingest-places/parse.test.ts`
Expected: FAIL — `Cannot find module './parse'`

- [ ] **Step 3: 구현**

```ts
// cp949 CSV 파일 → 헤더 키 객체 배열. 전체 버퍼 기준으로 디코드한다 —
// 앞부분만 잘라 읽으면 멀티바이트 문자가 끊겨 판별이 오탐한다(스펙 §2 실측).
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { decode } from "iconv-lite";

export function parseCsvFile(path: string): Record<string, string>[] {
  return parseCsvBuffer(readFileSync(path));
}

export function parseCsvBuffer(buffer: Buffer): Record<string, string>[] {
  // UTF-8 BOM 이면 utf-8, 아니면 cp949(5개 파일 전부 실측 cp949) — 갱신본 대비 안전망.
  const isUtf8Bom = buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
  const text = isUtf8Bom ? buffer.subarray(3).toString("utf-8") : decode(buffer, "cp949");
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as Record<string, string>[];
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run scripts/ingest-places/parse.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/ingest-places/parse.ts scripts/ingest-places/parse.test.ts
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#44): parse — cp949 전체 버퍼 디코드 + BOM 안전망 (TDD)/Claude"
```

---

### Task 6: `load.ts` — 배치 upsert + 폐업 전환

**Files:**
- Test: `scripts/ingest-places/load.test.ts`
- Create: `scripts/ingest-places/load.ts`

- [ ] **Step 1: chunk 테스트 작성** (네트워크 호출부는 시딩(Task 8)에서 실물 검증 — 여기선 순수 로직만)

```ts
// load 단위 테스트 — chunk 분할 (네트워크 경로는 Task 8 시딩에서 실물 검증)
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { chunk } from "./load";

describe("chunk", () => {
  it("지정 크기로 나눈다", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("빈 배열은 빈 결과다", () => {
    expect(chunk([], 500)).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run scripts/ingest-places/load.test.ts`
Expected: FAIL — `Cannot find module './load'`

- [ ] **Step 3: 구현**

```ts
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
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function createServiceClient(url: string, serviceKey: string) {
  return createClient<Database>(url, serviceKey, { auth: { persistSession: false } });
}

type ServiceClient = ReturnType<typeof createServiceClient>;

export async function upsertPlaces(client: ServiceClient, rows: PlaceUpsert[]): Promise<void> {
  for (const part of chunk(rows, UPSERT_CHUNK)) {
    const { error } = await client
      .from("places")
      .upsert(part, { onConflict: "source,external_id" });
    if (error) throw new Error(`upsert 실패 (${part.length}행 chunk): ${error.message}`);
  }
}

/** 원장에 이미 있는 장소만 closed 로 전환 — 없는 관리번호는 조용히 무시된다(스펙 §4-2). */
export async function markClosed(client: ServiceClient, externalIds: string[]): Promise<void> {
  for (const part of chunk(externalIds, CLOSED_CHUNK)) {
    const { error } = await client
      .from("places")
      .update({ status: "closed" })
      .eq("source", SOURCE)
      .in("external_id", part);
    if (error) throw new Error(`closed 전환 실패: ${error.message}`);
  }
}
```

- [ ] **Step 4: 통과 + 타입체크**

Run: `npx vitest run scripts/ingest-places/load.test.ts && npm run typecheck`
Expected: PASS (2 tests), 타입체크 통과

- [ ] **Step 5: Commit**

```bash
git add scripts/ingest-places/load.ts scripts/ingest-places/load.test.ts
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#44): load — 배치 upsert·폐업 전환·chunk/Claude"
```

---

### Task 7: `index.ts` — CLI 조립 + 리포트

**Files:**
- Create: `scripts/ingest-places/index.ts`

- [ ] **Step 1: 구현** (조립 코드 — 파일시스템·DB에 붙어 단위 테스트 대신 Task 8 실행으로 검증)

```ts
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
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 .env.local 에 필요하다.");
  }
  const client = createServiceClient(url, serviceKey);

  for (const { file, category } of SOURCE_FILES) {
    const records = parseCsvFile(resolve(process.cwd(), "data", file));

    // 파일 단위 오류는 즉시 중단 — 잘못된 매핑으로 수만 행을 넣는 것이 최악이다(스펙 §7).
    const first = records[0];
    if (!first) throw new Error(`${file}: 빈 파일`);
    const missing = Object.values(COLUMNS).filter((column) => !(column in first));
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
      } else if (seen.has(result.kind === "upsert" ? result.row.external_id : result.externalId)) {
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
```

- [ ] **Step 2: 타입체크 + 전체 테스트 + 빌드**

Run: `npm run typecheck && npm run test && npm run build`
Expected: 전부 통과 (유닛 89 + 신규 14)

- [ ] **Step 3: Commit**

```bash
git add scripts/ingest-places/index.ts
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#44): 수집 CLI — 헤더 검증·중복 방지·사유별 리포트/Claude"
```

---

### Task 8: 시딩 실행 + 원격 실측 검증

**선행 조건 (지호님):** Supabase 대시보드 → Settings → API 에서 service_role 키를 복사해 `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY=...` 추가. **이 키는 RLS를 우회한다 — `NEXT_PUBLIC_` 접두사 금지, 커밋 금지(.env*는 이미 gitignore).**

- [ ] **Step 1: 시딩 실행**

Run: `npm run ingest:places`
Expected: 5개 카테고리 리포트. upsert 합계는 실측 기준 약 36,000행(영업+휴업 36,476 − 좌표 결측 ~4%). closed 마커는 첫 실행에선 대부분 no-op.

- [ ] **Step 2: 재실행으로 멱등성 확인**

Run: `npm run ingest:places`
Expected: 같은 리포트, 행수 불변 (upsert 갱신만)

- [ ] **Step 3: SQL 실측 (MCP `execute_sql`)**

```sql
select category, status, count(*) from public.places group by 1, 2 order by 1, 2;
select min(lat), max(lat), min(lng), max(lng),
       count(*) filter (where geog is null) as geog_null,
       count(*) as total
from public.places;
```

Expected: 카테고리 5종 전부 존재, status 는 operating·suspended 만(첫 실행), 좌표 min/max 가 한국 상자(33~39, 124~132) 안, `geog_null = 0`.

- [ ] **Step 4: 통계 갱신 후 GIST 인덱스 실측**

```sql
analyze public.places;
explain (analyze, buffers)
select * from public.nearby_places(37.5665, 126.9780, 3000);
```

Expected: 실행계획에 `Index Scan using places_geog_*` (GIST). Seq Scan 이면 인덱스 정의를 확인하고 원인 파악 전에 넘어가지 않는다(supabase-convention §3-3).

- [ ] **Step 5: 스모크 — 서울 도심 반경 카운트**

```sql
select count(*) from public.nearby_places(37.5665, 126.9780, 3000);
select count(*) from public.nearby_places(37.5665, 126.9780, 3000, 'animal_hospital');
```

Expected: 0이 아니고 상식적인 수(도심 3km 병원 수십~수백). 결과를 눈으로 확인.

- [ ] **Step 6: 처리 리포트를 이슈에 기록**

```bash
gh issue comment 44 --body "<시딩 리포트: 카테고리별 upsert/스킵 카운트 + SQL 실측 결과 + explain 요약>"
```

---

### Task 9: 문서 갱신 + PR

- [ ] **Step 1: 스펙 §5 픽스처 문구 정정** — `fixtures/` 커밋 대신 "테스트 내 인라인 cp949 버퍼 생성"으로 실제 구현과 일치시킨다 (Task 5에서 정한 방식).

- [ ] **Step 2: README 진행 상황 갱신** — M3에 "장소 원장 시딩(5업종, N행)" 체크. (PR 생성 훅 요구사항이기도 하다.)

- [ ] **Step 3: `/verify` 순서 최종 확인**

Run: `npm run typecheck && npm run format:check && npm run lint && npm run build && npm run test`
Expected: 전부 통과

- [ ] **Step 4: `/pr` 플로우로 PR 생성** — 이슈 #44 완료 코멘트, push, `gh pr create --base dev` (템플릿: 요약 / Closes #44 / 체크리스트), CI·CodeRabbit 감시.
