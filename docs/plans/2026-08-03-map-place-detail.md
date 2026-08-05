# 지도 화면 + 장소 상세 (#48) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카카오맵 위에 장소 원장 34,832행을 띄우는 지도 화면(바텀시트·카테고리 칩·재검색)과 장소 상세(`/place?id=`)를 완성한다.

**Architecture:** 카카오 JS SDK를 래퍼 없이 `widgets/place-map`에 캡슐화(Context7 실측 — react-kakao-maps-sdk는 신뢰할 문서가 없어 배제). 물방울 핀은 SVG data URI `MarkerImage` + SDK 클러스터러. 데이터는 `entities/place`의 쿼리 훅이 `nearby_places` RPC·단건 select를 감싼다. 바텀시트는 **커스텀 비모달 시트**(아래 "구현 중 뒤집힌 결정" 참조).

**Tech Stack:** Kakao Maps JS SDK v2(autoload=false, libraries=clusterer), TanStack Query, react-icons/lu.

**전제:** `.env.local`에 `NEXT_PUBLIC_KAKAO_MAP_KEY`(JS 키, 32-hex 실측 확인) + SDK 도메인 `http://localhost:3000`·`https://localhost` 등록 완료. 스펙: [docs/specs/2026-08-03-map-place-detail-design.md](../specs/2026-08-03-map-place-detail-design.md).

## 구현 중 뒤집힌 결정 — 아래 본문보다 이 절이 우선한다

이 계획은 실행 **전에** 쓴 것이고, 실행 중 브라우저 실측으로 두 결정이 뒤집혔다. 본문(Task 3·Task 8 등)에는 뒤집히기 전의 `Drawer`·`toast` 코드가 그대로 남아 있다. **다시 실행할 일이 있으면 아래를 따르고 본문의 해당 부분은 무시한다.**

1. **바텀시트는 vaul(shadcn drawer)이 아니라 커스텀 시트다.** vaul 1.1.2 는 `modal` prop 을 Radix `Dialog.Root` 에 전달하지 않아(소스 실측) 항상 모달로 동작한다 — 상시 노출 비모달 시트에서 앱 전체 `aria-hidden` + `body { pointer-events: none }` 이 걸린다. 실물은 `src/views/map/place-bottom-sheet.tsx`(포털 없는 순수 `div`). 금지 근거는 [design-convention](../conventions/design-convention.md).
2. **위치 폴백 안내는 toast 가 아니라 상주 배너다.** 상단 토스트가 카테고리 칩 열을 4초간 덮어 포인터를 가로챈다(E2E 실측). 상태 정보라 상주 UI 가 맞고, `useCurrentPosition` 의 `isFallback` 으로 표시한다.

---

## 작업

### Task 1: 카테고리 색 토큰 + 상수 (단일 진실 공유 검증)

**Files:**
- Modify: `src/app/globals.css` (@theme inline 블록 + :root + .dark)
- Create: `src/entities/place/model/category.ts`
- Test: `src/entities/place/model/category.test.ts`

- [ ] **Step 1: globals.css에 장소 카테고리 토큰 추가**

`:root` 블록(라이트 원값들 옆)에:

```css
  /* 장소 카테고리 색 — 마커·태그 공용(정보/의미 층, 아이콘 병행 필수).
     SVG MarkerImage 는 CSS 변수를 못 읽어 entities/place/model/category.ts 의
     상수와 값을 공유한다. 어긋나면 category.test.ts 가 잡는다(6-1 표). */
  --place-hospital: #e5484d;
  --place-pharmacy: #30a46c;
  --place-grooming: #d6409f;
  --place-boarding: #0091ff;
  --place-funeral: #7e808a;
```

`.dark` 블록에 (어두운 면 위 글자용으로 밝힌 값 — 핀은 항상 라이트 지도 위라 TS 상수의 라이트 값 고정):

```css
  --place-hospital: #ff6369;
  --place-pharmacy: #3dd68c;
  --place-grooming: #f65cb6;
  --place-boarding: #52a9ff;
  --place-funeral: #a8aab3;
```

`@theme inline` 블록에:

```css
  --color-place-hospital: var(--place-hospital);
  --color-place-pharmacy: var(--place-pharmacy);
  --color-place-grooming: var(--place-grooming);
  --color-place-boarding: var(--place-boarding);
  --color-place-funeral: var(--place-funeral);
```

- [ ] **Step 2: 실패하는 테스트 작성** — `category.test.ts`

```tsx
// 카테고리 상수 무결성 — 5업종 완비 + globals.css 토큰과 마커 색 동기 검증
// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { Constants } from "@/shared/lib/supabase/database.types";
import { PLACE_CATEGORY, PLACE_CATEGORY_LIST } from "./category";

describe("PLACE_CATEGORY", () => {
  it("DB enum 5업종 전부에 라벨·마커색·글리프·아이콘·칩 클래스가 있다", () => {
    for (const code of Constants.public.Enums.place_category) {
      const entry = PLACE_CATEGORY[code];
      expect(entry.label).toBeTruthy();
      expect(entry.markerColor).toMatch(/^#[0-9a-f]{6}$/);
      expect(entry.glyph).toHaveLength(1);
      expect(entry.Icon).toBeTypeOf("function");
      expect(entry.chipClass).toContain("text-place-");
    }
    expect(PLACE_CATEGORY_LIST.map((c) => c.code)).toEqual([
      ...Constants.public.Enums.place_category,
    ]);
  });

  it("마커 색이 globals.css 라이트 토큰과 일치한다 — SVG 는 CSS 변수를 못 읽는다", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/app/globals.css"),
      "utf-8",
    );
    for (const [code, entry] of Object.entries(PLACE_CATEGORY)) {
      const token = code === "animal_hospital" ? "hospital" : code;
      const match = css.match(
        new RegExp(`--place-${token}:\\s*(#[0-9a-f]{6})`),
      );
      expect(match?.[1], `--place-${token} 토큰 누락`).toBe(entry.markerColor);
    }
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run src/entities/place/model/category.test.ts`
Expected: FAIL — `Cannot find module './category'`

- [ ] **Step 4: 구현** — `category.ts`

```tsx
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
  /** Tailwind JIT 는 리터럴만 인식 — 동적 조립 금지 */
  chipClass: string;
};

export const PLACE_CATEGORY: Record<PlaceCategory, CategoryEntry> = {
  animal_hospital: {
    label: "병원",
    markerColor: "#e5484d",
    glyph: "병",
    Icon: LuCross,
    chipClass: "text-place-hospital bg-place-hospital/10",
  },
  grooming: {
    label: "미용",
    markerColor: "#d6409f",
    glyph: "미",
    Icon: LuScissors,
    chipClass: "text-place-grooming bg-place-grooming/10",
  },
  boarding: {
    label: "호텔",
    markerColor: "#0091ff",
    glyph: "호",
    Icon: LuBedDouble,
    chipClass: "text-place-boarding bg-place-boarding/10",
  },
  pharmacy: {
    label: "약국",
    markerColor: "#30a46c",
    glyph: "약",
    Icon: LuPill,
    chipClass: "text-place-pharmacy bg-place-pharmacy/10",
  },
  funeral: {
    label: "장묘",
    markerColor: "#7e808a",
    glyph: "장",
    Icon: LuFlower2,
    chipClass: "text-place-funeral bg-place-funeral/10",
  },
};

/** DB enum 선언 순서 그대로의 목록 — 칩 열·범례가 쓴다 */
export const PLACE_CATEGORY_LIST = (
  ["animal_hospital", "grooming", "boarding", "pharmacy", "funeral"] as const
).map((code) => ({ code, ...PLACE_CATEGORY[code] }));
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/entities/place/model/category.test.ts`
Expected: PASS (2 tests). `LuBedDouble`·`LuFlower2` 등이 react-icons/lu 에 없으면 typecheck 가 잡는다 — 그 경우 `npx tsx -e "import * as lu from 'react-icons/lu'; console.log(Object.keys(lu).filter(k=>/Bed|Flower|Pill|Cross|Scissors/.test(k)))"` 로 실존 이름을 실측해 교체한다.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/entities/place/model/category.ts src/entities/place/model/category.test.ts
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#48): 장소 카테고리 토큰·상수 — CSS/TS 동기 테스트 (TDD)/Claude"
```

---

### Task 2: geo 유틸 — haversine·거리 포맷 (TDD)

**Files:**
- Create: `src/entities/place/model/geo.ts`
- Test: `src/entities/place/model/geo.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// geo 유틸 — 반경 계산(haversine)·거리 표기
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatDistance, haversineMeters } from "./geo";

describe("haversineMeters", () => {
  it("같은 점은 0", () => {
    const p = { lat: 37.5665, lng: 126.978 };
    expect(haversineMeters(p, p)).toBe(0);
  });

  it("서울시청→광화문 약 600m (±15%)", () => {
    const cityHall = { lat: 37.5665, lng: 126.978 };
    const gwanghwamun = { lat: 37.5759, lng: 126.9769 };
    const d = haversineMeters(cityHall, gwanghwamun);
    expect(d).toBeGreaterThan(890);
    expect(d).toBeLessThan(1210); // 실좌표 기준 약 1.05km — 지리 근사 허용
  });
});

describe("formatDistance", () => {
  it("1km 미만은 m 단위 정수", () => {
    expect(formatDistance(0)).toBe("0m");
    expect(formatDistance(999.4)).toBe("999m");
  });

  it("1km 이상은 km 소수 1자리", () => {
    expect(formatDistance(1000)).toBe("1.0km");
    expect(formatDistance(1234)).toBe("1.2km");
    expect(formatDistance(12340)).toBe("12.3km");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/entities/place/model/geo.test.ts`
Expected: FAIL — `Cannot find module './geo'`

- [ ] **Step 3: 구현**

```tsx
// 좌표 거리 유틸 — 지도 뷰포트 반경 계산과 리스트 거리 표기가 쓴다
export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/entities/place/model/geo.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/entities/place/model/geo.ts src/entities/place/model/geo.test.ts
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#48): geo 유틸 — haversine·거리 포맷 (TDD)/Claude"
```

---

### Task 3: entities/place — 타입·쿼리 키·메시지·훅

**Files:**
- Modify: `src/shared/config/query-keys.ts:33` (pet 블록 뒤)
- Modify: `src/shared/config/app-message.ts` (APP_MESSAGE + APP_MESSAGE_CODE 양쪽)
- Create: `src/entities/place/model/types.ts`
- Create: `src/entities/place/api/use-query-nearby-places.ts`
- Create: `src/entities/place/api/use-query-place.ts`
- Create: `src/entities/place/index.ts`

- [ ] **Step 1: QUERY_KEYS에 place 도메인 추가**

```ts
  place: {
    all: ["place"] as const,
    nearby: (params?: {
      lat: number;
      lng: number;
      radiusM: number;
      category: Enums<"place_category"> | null;
    }) =>
      [
        ...QUERY_KEYS.place.all,
        "nearby",
        ...(params
          ? [params.lat, params.lng, params.radiusM, params.category]
          : []),
      ] as const,
    detail: (placeId?: string) =>
      [...QUERY_KEYS.place.all, "detail", placeId].filter(
        (v) => v !== undefined,
      ),
  },
```

- [ ] **Step 2: APP_MESSAGE에 place 문구 추가** (APP_MESSAGE 객체와 APP_MESSAGE_CODE 양쪽 — 한쪽만 넣으면 app-message.test.ts 가 잡는다)

APP_MESSAGE 에:

```ts
  "place.nearbyFailed": {
    title: "주변 장소 불러오기 실패",
    description: "잠시 후 다시 시도해 주세요.",
  },
  "place.detailLoadFailed": {
    title: "장소 정보 불러오기 실패",
    description: "장소 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
  },
  "place.notFound": {
    title: "장소를 찾을 수 없어요",
    description: "삭제됐거나 잘못된 주소예요.",
  },
  "place.mapLoadFailed": {
    title: "지도 불러오기 실패",
    description: "지도를 불러오지 못했어요. 네트워크를 확인해 주세요.",
  },
  "place.locationFallback": {
    title: "현재 위치를 확인할 수 없어요",
    description: "서울 시청 기준으로 주변을 보여드려요.",
  },
```

APP_MESSAGE_CODE 에:

```ts
  place: {
    nearbyFailed: "place.nearbyFailed",
    detailLoadFailed: "place.detailLoadFailed",
    notFound: "place.notFound",
    mapLoadFailed: "place.mapLoadFailed",
    locationFallback: "place.locationFallback",
  },
```

- [ ] **Step 3: 타입 — RPC 반환 nullability 복원** (`model/types.ts`)

```tsx
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
```

- [ ] **Step 4: 쿼리 훅 2개**

`api/use-query-nearby-places.ts`:

```tsx
// 반경 내 장소 — nearby_places RPC. 상태 필터는 RPC 기본(operating만)을 쓴다.
"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createClient } from "@/shared/lib/supabase/client";
import type { PlaceCategory } from "../model/category";
import type { NearbyPlace } from "../model/types";

export type NearbySearchParams = {
  lat: number;
  lng: number;
  radiusM: number;
  category: PlaceCategory | null;
};

export function useQueryNearbyPlaces(params: NearbySearchParams | null) {
  return useQuery({
    queryKey: QUERY_KEYS.place.nearby(params ?? undefined),
    enabled: params !== null,
    queryFn: async (): Promise<NearbyPlace[]> => {
      const { data, error } = await createClient().rpc("nearby_places", {
        p_lat: params!.lat,
        p_lng: params!.lng,
        p_radius_m: Math.round(params!.radiusM),
        ...(params!.category ? { p_category: params!.category } : {}),
      });
      if (error) {
        console.error("[place] 주변 장소 조회 실패", error);
        throw error;
      }
      return data as NearbyPlace[];
    },
  });
}
```

`api/use-query-place.ts`:

```tsx
// 장소 단건 — 단순 select 라 RPC 로 감싸지 않는다(supabase-convention §3-4).
"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createClient } from "@/shared/lib/supabase/client";

export function useQueryPlace(placeId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.place.detail(placeId),
    enabled: Boolean(placeId),
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("places")
        .select(
          "id, category, status, name, road_address, jibun_address, phone, lat, lng",
        )
        .eq("id", placeId!)
        .maybeSingle();
      if (error) {
        console.error("[place] 단건 조회 실패", error);
        throw error;
      }
      return data; // null = 없는 장소 — 화면이 notFound 로 처리
    },
  });
}
```

- [ ] **Step 5: 공개 표면** (`index.ts`)

```tsx
// entities/place 공개 표면
export {
  PLACE_CATEGORY,
  PLACE_CATEGORY_LIST,
  type PlaceCategory,
} from "./model/category";
export { formatDistance, haversineMeters, type LatLng } from "./model/geo";
export type { NearbyPlace, PlaceDetail } from "./model/types";
export {
  useQueryNearbyPlaces,
  type NearbySearchParams,
} from "./api/use-query-nearby-places";
export { useQueryPlace } from "./api/use-query-place";
```

- [ ] **Step 6: 검증 + Commit**

Run: `npm run typecheck && npm run test`
Expected: 통과 (app-message.test 가 place 코드 정합도 검사)

```bash
git add src/shared/config/query-keys.ts src/shared/config/app-message.ts src/entities/place/
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#48): entities/place — nullability 복원 타입·쿼리 훅·문구/Claude"
```

---

### Task 4: shared/ui/drawer — shadcn(vaul) 추가

**Files:**
- Create: `src/shared/ui/drawer.tsx` (shadcn 생성)
- Modify: `docs/conventions/design-convention.md` (6-1 표)

- [ ] **Step 1: dry-run 으로 덮어쓸 파일 확인** (6-2 규칙 — button 덮어쓰기 사고 재발 방지)

Run: `npx shadcn@latest add drawer --dry-run`
Expected: 생성 목록에 `drawer.tsx` 만. 기존 파일(button 등) 덮어쓰기가 보이면 **중단**하고 대상 파일을 백업 후 진행.

- [ ] **Step 2: 실제 추가**

Run: `npx shadcn@latest add drawer`
Expected: `src/shared/ui/drawer.tsx` 생성 (components.json 별칭 기준)

- [ ] **Step 3: 파일 헤더 주석 + 6-1 표 등재**

drawer.tsx 첫 줄에 `// 바텀시트/드로어 — vaul 래퍼 (shadcn)` 추가. design-convention 6-1 표에 행 추가:

```markdown
| drawer | 원본 그대로 + 헤더 주석 | 지도 바텀시트(#48)가 스냅포인트로 사용 |
```

- [ ] **Step 4: 검증 + Commit**

Run: `npm run typecheck && npm run build`

```bash
git add src/shared/ui/drawer.tsx docs/conventions/design-convention.md
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#48): shared/ui/drawer 추가 — shadcn(vaul), dry-run 검증/Claude"
```

---

### Task 5: 카카오 SDK 타입 선언 + 로더 훅

**Files:**
- Create: `src/widgets/place-map/lib/kakao.d.ts`
- Create: `src/widgets/place-map/lib/use-kakao-maps.ts`

- [ ] **Step 1: 최소 타입 선언** (`kakao.d.ts` — 우리가 쓰는 표면만. 전체 타입 패키지는 관리 주체 불명이라 배제)

```tsx
// 카카오맵 JS SDK 최소 타입 — 사용하는 표면만 선언한다(전량 any 금지, 전량 선언도 과함)
declare namespace kakao.maps {
  function load(callback: () => void): void;

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  class LatLngBounds {
    getSouthWest(): LatLng;
    getNorthEast(): LatLng;
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
    draggable?: boolean;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    getCenter(): LatLng;
    getBounds(): LatLngBounds;
    setDraggable(draggable: boolean): void;
    setZoomable(zoomable: boolean): void;
    relayout(): void;
  }

  class MarkerImage {
    constructor(
      src: string,
      size: Size,
      options?: { offset?: Point; alt?: string },
    );
  }

  interface MarkerOptions {
    position: LatLng;
    image?: MarkerImage;
    title?: string;
    zIndex?: number;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    setImage(image: MarkerImage): void;
    setZIndex(zIndex: number): void;
  }

  class MarkerClusterer {
    constructor(options: {
      map: Map;
      averageCenter?: boolean;
      minLevel?: number;
      disableClickZoom?: boolean;
    });
    addMarkers(markers: Marker[]): void;
    clear(): void;
  }

  namespace event {
    function addListener(
      target: Map | Marker,
      type: string,
      handler: () => void,
    ): void;
  }
}

interface Window {
  kakao: typeof kakao;
}
```

- [ ] **Step 2: 로더 훅** (`use-kakao-maps.ts`)

```tsx
// 카카오맵 SDK 지연 로더 — autoload=false 로 받아 kakao.maps.load 완료를 상태로 노출.
// 스크립트는 전역 1회만 삽입한다(지도 화면·상세 미니 지도가 공유).
"use client";

import { useCallback, useEffect, useState } from "react";

let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (window.kakao?.maps?.Map) return Promise.resolve();
  sdkPromise ??= new Promise<void>((resolve, reject) => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!appKey) {
      sdkPromise = null;
      reject(new Error("NEXT_PUBLIC_KAKAO_MAP_KEY 가 없다"));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=clusterer`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = () => {
      script.remove();
      sdkPromise = null; // 실패는 캐시하지 않는다 — 재시도 가능해야 한다
      reject(new Error("카카오맵 SDK 로드 실패"));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export function useKakaoMaps() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  const attempt = useCallback(() => {
    setStatus("loading");
    loadSdk().then(
      () => setStatus("ready"),
      (error) => {
        console.error("[place-map] SDK 로드 실패", error);
        setStatus("error");
      },
    );
  }, []);

  useEffect(() => {
    attempt();
  }, [attempt]);

  return { status, retry: attempt };
}
```

- [ ] **Step 3: 검증 + Commit**

Run: `npm run typecheck && npm run lint`

```bash
git add src/widgets/place-map/lib/kakao.d.ts src/widgets/place-map/lib/use-kakao-maps.ts
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#48): 카카오 SDK 최소 타입·지연 로더 훅/Claude"
```

---

### Task 6: 물방울 핀 SVG (TDD)

**Files:**
- Create: `src/widgets/place-map/lib/marker-svg.ts`
- Test: `src/widgets/place-map/lib/marker-svg.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// 물방울 핀 SVG 생성 — 색·글리프 삽입, 선택 확대
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PIN_SIZE, placePinDataUrl } from "./marker-svg";

describe("placePinDataUrl", () => {
  it("data URI 로 색과 글리프가 들어간 SVG 를 만든다", () => {
    const url = placePinDataUrl({ color: "#e5484d", glyph: "병" });
    expect(url.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    const svg = decodeURIComponent(url.split(",")[1]!);
    expect(svg).toContain("#e5484d");
    expect(svg).toContain("병");
  });

  it("선택 핀은 기본보다 크다", () => {
    expect(PIN_SIZE.selected.width).toBeGreaterThan(PIN_SIZE.base.width);
    expect(PIN_SIZE.selected.height).toBeGreaterThan(PIN_SIZE.base.height);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/widgets/place-map/lib/marker-svg.test.ts`
Expected: FAIL — `Cannot find module './marker-svg'`

- [ ] **Step 3: 구현**

```tsx
// 물방울 핀 SVG — 카테고리 색 + 흰 글리프. MarkerImage 는 CSS 를 못 읽어
// data URI 로 굽는다. 크기 값은 MarkerImage 의 Size/offset 과 함께 쓴다.
export const PIN_SIZE = {
  base: { width: 28, height: 36 },
  selected: { width: 38, height: 49 },
} as const;

export function placePinDataUrl(options: {
  color: string;
  glyph: string;
}): string {
  // viewBox 28x36 — 꼬리 끝(14,36)이 좌표점. offset 은 (width/2, height).
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 36">` +
    `<path d="M14 0C6.3 0 0 6.3 0 14c0 9.6 14 22 14 22s14-12.4 14-22C28 6.3 21.7 0 14 0Z" ` +
    `fill="${options.color}" stroke="#ffffff" stroke-width="1.5"/>` +
    `<text x="14" y="18.5" text-anchor="middle" font-size="11" font-weight="700" ` +
    `fill="#ffffff" font-family="sans-serif">${options.glyph}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
```

- [ ] **Step 4: 통과 확인 + Commit**

Run: `npx vitest run src/widgets/place-map/lib/marker-svg.test.ts`
Expected: PASS (2 tests)

```bash
git add src/widgets/place-map/lib/marker-svg.ts src/widgets/place-map/lib/marker-svg.test.ts
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#48): 물방울 핀 SVG 생성기 (TDD)/Claude"
```

---

### Task 7: widgets/place-map — 지도·마커·클러스터러 + 미니 지도

**Files:**
- Create: `src/widgets/place-map/ui/place-map.tsx`
- Create: `src/widgets/place-map/ui/mini-map.tsx`
- Create: `src/widgets/place-map/index.ts`

SDK 는 jsdom 에서 돌 수 없다 — 이 위젯의 검증은 Task 10 의 E2E·브라우저 실측이 맡는다.

- [ ] **Step 1: `place-map.tsx`**

```tsx
// 지도 본체 — 카카오 지도·물방울 마커·클러스터러를 캡슐화한다 (스펙 §2).
// 데이터는 밖(views/map)이 주고, 이 컴포넌트는 그리기와 이벤트 중계만 한다.
"use client";

import { useEffect, useRef } from "react";
import {
  PLACE_CATEGORY,
  haversineMeters,
  type LatLng as GeoLatLng,
  type NearbyPlace,
} from "@/entities/place";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { cn } from "@/shared/lib/utils";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { useKakaoMaps } from "../lib/use-kakao-maps";
import { PIN_SIZE, placePinDataUrl } from "../lib/marker-svg";

export type MapViewport = GeoLatLng & { radiusM: number };

type PlaceMapProps = {
  /** 최초 중심. 이후 이동은 지도가 스스로 관리한다(비제어). */
  initialCenter: GeoLatLng;
  /** 값이 바뀌면 지도를 그 좌표로 이동시킨다 — 현위치 버튼·상세→포커스용 */
  flyTo?: (GeoLatLng & { key: number }) | null;
  places: NearbyPlace[];
  selectedId: string | null;
  onSelectPlace: (id: string) => void;
  /** 사용자가 지도를 움직여 멈출 때(idle) — 재검색 버튼 노출·좌표 갱신용 */
  onViewportChange?: (viewport: MapViewport) => void;
  className?: string;
};

export function PlaceMap({
  initialCenter,
  places,
  selectedId,
  onSelectPlace,
  onViewportChange,
  className,
}: PlaceMapProps) {
  const { status, retry } = useKakaoMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null);
  const markersRef = useRef(new Map<string, kakao.maps.Marker>());

  // 콜백 최신값 참조 — 지도 이벤트 리스너는 한 번만 등록한다.
  const callbacksRef = useRef({ onSelectPlace, onViewportChange });
  callbacksRef.current = { onSelectPlace, onViewportChange };

  // 지도 생성 (SDK ready 후 1회)
  useEffect(() => {
    if (status !== "ready" || !containerRef.current || mapRef.current) return;
    const map = new kakao.maps.Map(containerRef.current, {
      center: new kakao.maps.LatLng(initialCenter.lat, initialCenter.lng),
      level: 5, // 약 반경 1~2km 급 — 초기 검색 반경과 비슷한 체감
    });
    mapRef.current = map;
    clustererRef.current = new kakao.maps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: 7, // 가까운 줌에선 개별 핀, 넓은 줌에서만 묶는다
    });
    kakao.maps.event.addListener(map, "idle", () => {
      const center = map.getCenter();
      const ne = map.getBounds().getNorthEast();
      const c = { lat: center.getLat(), lng: center.getLng() };
      callbacksRef.current.onViewportChange?.({
        ...c,
        radiusM: haversineMeters(c, { lat: ne.getLat(), lng: ne.getLng() }),
      });
    });
    // 생성 직후 컨테이너 크기 반영(탭 전환 직후 0 크기 문제 방지)
    requestAnimationFrame(() => map.relayout());
  }, [status, initialCenter]);

  // flyTo — 같은 좌표로도 다시 이동할 수 있게 key 로 변화를 식별한다
  const flyToKey = flyTo?.key;
  useEffect(() => {
    if (!mapRef.current || !flyTo) return;
    mapRef.current.setCenter(new kakao.maps.LatLng(flyTo.lat, flyTo.lng));
  }, [flyToKey]); // eslint-disable-line react-hooks/exhaustive-deps -- key 가 변화의 전부

  // 마커 동기화 — places·selectedId 가 바뀌면 다시 그린다
  useEffect(() => {
    const map = mapRef.current;
    const clusterer = clustererRef.current;
    if (!map || !clusterer) return;

    clusterer.clear();
    markersRef.current.clear();

    const markers = places.map((place) => {
      const entry = PLACE_CATEGORY[place.category];
      const selected = place.id === selectedId;
      const size = selected ? PIN_SIZE.selected : PIN_SIZE.base;
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(place.lat, place.lng),
        image: new kakao.maps.MarkerImage(
          placePinDataUrl({ color: entry.markerColor, glyph: entry.glyph }),
          new kakao.maps.Size(size.width, size.height),
          {
            offset: new kakao.maps.Point(size.width / 2, size.height),
            alt: `${place.name} (${entry.label})`,
          },
        ),
        title: place.name,
        zIndex: selected ? 10 : 1,
      });
      kakao.maps.event.addListener(marker, "click", () =>
        callbacksRef.current.onSelectPlace(place.id),
      );
      markersRef.current.set(place.id, marker);
      return marker;
    });
    clusterer.addMarkers(markers);
  }, [places, selectedId, status]);

  if (status === "error") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <ErrorState code={APP_MESSAGE_CODE.place.mapLoadFailed} onRetry={retry} />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {status === "loading" && <Skeleton className="absolute inset-0" />}
      <div ref={containerRef} className="size-full" aria-hidden />
    </div>
  );
}
```

- [ ] **Step 2: `mini-map.tsx`**

```tsx
// 상세 화면의 위치 미니 지도 — 조작 잠금, 핀 하나 (스펙 §3)
"use client";

import { useEffect, useRef } from "react";
import { PLACE_CATEGORY, type PlaceCategory } from "@/entities/place";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { useKakaoMaps } from "../lib/use-kakao-maps";
import { PIN_SIZE, placePinDataUrl } from "../lib/marker-svg";

type MiniMapProps = {
  lat: number;
  lng: number;
  category: PlaceCategory;
  className?: string;
};

export function MiniMap({ lat, lng, category, className }: MiniMapProps) {
  const { status } = useKakaoMaps();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "ready" || !containerRef.current) return;
    const position = new kakao.maps.LatLng(lat, lng);
    const map = new kakao.maps.Map(containerRef.current, {
      center: position,
      level: 4,
      draggable: false,
    });
    map.setZoomable(false);
    const entry = PLACE_CATEGORY[category];
    new kakao.maps.Marker({
      position,
      image: new kakao.maps.MarkerImage(
        placePinDataUrl({ color: entry.markerColor, glyph: entry.glyph }),
        new kakao.maps.Size(PIN_SIZE.base.width, PIN_SIZE.base.height),
        { offset: new kakao.maps.Point(PIN_SIZE.base.width / 2, PIN_SIZE.base.height) },
      ),
    }).setMap(map);
    requestAnimationFrame(() => map.relayout());
  }, [status, lat, lng, category]);

  // 미니 지도는 보조 시각 정보 — 실패해도 주소 텍스트가 있어 화면은 성립한다.
  if (status === "error") return null;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {status === "loading" && <Skeleton className="absolute inset-0" />}
      <div ref={containerRef} className="size-full" aria-hidden />
    </div>
  );
}
```

- [ ] **Step 3: 공개 표면** (`index.ts`)

```tsx
// widgets/place-map 공개 표면 — 카카오 SDK 는 이 폴더 밖으로 새지 않는다
export { PlaceMap, type MapViewport } from "./ui/place-map";
export { MiniMap } from "./ui/mini-map";
```

- [ ] **Step 4: 검증 + Commit**

Run: `npm run typecheck && npm run lint && npm run build`

```bash
git add src/widgets/place-map/
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#48): widgets/place-map — 지도·클러스터러·미니 지도 캡슐화/Claude"
```

---

### Task 8: views/map — 칩(TDD)·바텀시트·재검색·현위치 조립

**Files:**
- Create: `src/views/map/category-chips.tsx`
- Test: `src/views/map/category-chips.test.tsx`
- Create: `src/views/map/place-row.tsx`
- Test: `src/views/map/place-row.test.tsx`
- Create: `src/views/map/use-current-position.ts`
- Modify: `src/views/map/index.tsx` (placeholder 교체)
- Modify: `src/app/(tabs)/map/page.tsx` (Suspense 래핑)

- [ ] **Step 1: 칩 실패 테스트** (`category-chips.test.tsx`)

```tsx
// 카테고리 칩 — 단일 선택 토글 (같은 칩 재탭 = 해제)
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CategoryChips } from "./category-chips";

describe("CategoryChips", () => {
  it("전체 + 5업종 칩을 그린다", () => {
    render(<CategoryChips value={null} onChange={vi.fn()} />);
    for (const label of ["전체", "병원", "미용", "호텔", "약국", "장묘"]) {
      expect(screen.getByRole("radio", { name: label })).toBeInTheDocument();
    }
  });

  it("업종 탭 → 해당 코드, 전체 탭 → null", async () => {
    const onChange = vi.fn();
    render(<CategoryChips value={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "병원" }));
    expect(onChange).toHaveBeenLastCalledWith("animal_hospital");
  });

  it("선택된 업종을 다시 탭하면 해제(null)", async () => {
    const onChange = vi.fn();
    render(<CategoryChips value="pharmacy" onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "약국" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/views/map/category-chips.test.tsx`
Expected: FAIL — `Cannot find module './category-chips'`

- [ ] **Step 3: 칩 구현** (`category-chips.tsx`)

```tsx
// 카테고리 필터 칩 — 단일 선택, 재탭 해제 (스펙 §1). radiogroup 시맨틱.
"use client";

import { PLACE_CATEGORY_LIST, type PlaceCategory } from "@/entities/place";
import { cn } from "@/shared/lib/utils";

type CategoryChipsProps = {
  value: PlaceCategory | null;
  onChange: (value: PlaceCategory | null) => void;
};

const CHIPS: Array<{ code: PlaceCategory | null; label: string }> = [
  { code: null, label: "전체" },
  ...PLACE_CATEGORY_LIST.map(({ code, label }) => ({ code, label })),
];

export function CategoryChips({ value, onChange }: CategoryChipsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="장소 종류 필터"
      className="flex gap-2 overflow-x-auto px-4 py-2 select-none"
    >
      {CHIPS.map((chip) => {
        const active = value === chip.code;
        return (
          <button
            key={chip.label}
            type="button"
            role="radio"
            aria-checked={active}
            // 같은 칩 재탭 = 해제(전체). "전체" 재탭은 그대로 전체.
            onClick={() => onChange(active ? null : chip.code)}
            className={cn(
              "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium shadow-sm transition-colors",
              active
                ? "border-transparent bg-primary font-bold text-primary-foreground"
                : "border-border bg-card text-foreground",
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: 칩 통과 확인**

Run: `npx vitest run src/views/map/category-chips.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: 장소 행 실패 테스트** (`place-row.test.tsx`)

```tsx
// 바텀시트 장소 행 — 이름·태그·거리·상세 링크
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { NearbyPlace } from "@/entities/place";
import { PlaceRow } from "./place-row";

const place: NearbyPlace = {
  id: "p1",
  external_id: "x",
  category: "animal_hospital",
  status: "operating",
  name: "별별동물병원",
  road_address: "서울 중구 어딘가로 1",
  jibun_address: null,
  phone: null,
  lat: 37.5,
  lng: 127,
  distance_m: 321.4,
};

describe("PlaceRow", () => {
  it("이름·카테고리·거리·주소를 그리고 상세로 링크한다", () => {
    render(<PlaceRow place={place} />);
    const link = screen.getByRole("link", { name: /별별동물병원/ });
    expect(link).toHaveAttribute("href", "/place?id=p1");
    expect(screen.getByText("병원")).toBeInTheDocument();
    expect(screen.getByText("321m")).toBeInTheDocument();
    expect(screen.getByText("서울 중구 어딘가로 1")).toBeInTheDocument();
  });

  it("주소 결측이면 주소 줄을 그리지 않는다", () => {
    render(<PlaceRow place={{ ...place, road_address: null }} />);
    expect(screen.queryByText(/서울 중구/)).toBeNull();
  });
});
```

- [ ] **Step 6: 실패 확인**

Run: `npx vitest run src/views/map/place-row.test.tsx`
Expected: FAIL — `Cannot find module './place-row'`

- [ ] **Step 7: 장소 행 구현** (`place-row.tsx`)

```tsx
// 바텀시트 리스트의 장소 행 — 탭하면 상세로 (스펙 §1)
import Link from "next/link";
import {
  PLACE_CATEGORY,
  formatDistance,
  type NearbyPlace,
} from "@/entities/place";
import { cn } from "@/shared/lib/utils";

export function PlaceRow({ place }: { place: NearbyPlace }) {
  const category = PLACE_CATEGORY[place.category];
  return (
    <Link
      href={`/place?id=${place.id}`}
      prefetch={false}
      className="flex min-h-14 flex-col justify-center gap-0.5 border-b border-border px-4 py-2"
    >
      <span className="flex items-center gap-2">
        <span className="font-heading text-sm font-bold">{place.name}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold",
            category.chipClass,
          )}
        >
          <category.Icon aria-hidden className="size-3" />
          {category.label}
        </span>
      </span>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {formatDistance(place.distance_m)}
        </span>
        {place.road_address && <span>{place.road_address}</span>}
      </span>
    </Link>
  );
}
```

- [ ] **Step 8: 통과 확인**

Run: `npx vitest run src/views/map/place-row.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 9: 현위치 훅** (`use-current-position.ts`)

```tsx
// 현위치 1회 획득 — 거부·실패 시 서울시청 폴백 + 토스트 (스펙 §1·§7)
// Capacitor WebView 의 권한 동작은 에뮬레이터에서 실측한다(#48 완료 조건).
"use client";

import { useEffect, useRef, useState } from "react";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppError } from "@/shared/lib/app-toast";
import type { LatLng } from "@/entities/place";

export const SEOUL_CITY_HALL: LatLng = { lat: 37.5665, lng: 126.978 };

export function useCurrentPosition() {
  const [position, setPosition] = useState<LatLng | null>(null);

  // 현위치 버튼이 재호출한다 — 처음 거부했다가 허용한 사용자를 위해 매번 다시 묻는다.
  const refresh = useCallback(() => {
    if (!navigator.geolocation) {
      toastAppError(APP_MESSAGE_CODE.place.locationFallback);
      setPosition({ ...SEOUL_CITY_HALL });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setPosition({ lat: coords.latitude, lng: coords.longitude }),
      (error) => {
        toastAppError(APP_MESSAGE_CODE.place.locationFallback, error);
        setPosition({ ...SEOUL_CITY_HALL }); // 새 객체 — flyTo 재트리거용
      },
      { timeout: 5000, maximumAge: 60_000 },
    );
  }, []);

  const requested = useRef(false);
  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    refresh();
  }, [refresh]);

  return { position, refresh }; // position null = 아직 확인 중
}
```

- [ ] **Step 10: 화면 조립** (`index.tsx` 교체 — placeholder 삭제)

```tsx
// 지도 화면 — 카카오맵 + 카테고리 칩 + 바텀시트 리스트 + 재검색 (스펙 §1)
"use client";

import { useCallback, useState } from "react";
import { LuLocateFixed, LuRotateCw } from "react-icons/lu";
import {
  useQueryNearbyPlaces,
  type NearbySearchParams,
  type PlaceCategory,
} from "@/entities/place";
import { PlaceMap, type MapViewport } from "@/widgets/place-map";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { Button } from "@/shared/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { CategoryChips } from "./category-chips";
import { PlaceRow } from "./place-row";
import { SEOUL_CITY_HALL, useCurrentPosition } from "./use-current-position";

const INITIAL_RADIUS_M = 3000;

function MapContent() {
  // 상세의 "지도에서 보기" 가 /map?place=<id> 로 들어온다 — 그 장소를 포커스한다.
  const focusPlaceId = useSearchParams().get("place") ?? undefined;
  const focusPlace = useQueryPlace(focusPlaceId);

  const { position: origin, refresh: refreshPosition } = useCurrentPosition();
  const [category, setCategory] = useState<PlaceCategory | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 검색 기준(쿼리 파라미터)과 지도의 현재 뷰포트는 분리 — 버튼이 잇는다.
  const [search, setSearch] = useState<NearbySearchParams | null>(null);
  const [viewport, setViewport] = useState<MapViewport | null>(null);
  const [moved, setMoved] = useState(false);
  const [flyTo, setFlyTo] = useState<(LatLng & { key: number }) | null>(null);

  // 시작 기준점: 포커스 장소 > 현위치. 포커스 파라미터가 있으면 그 좌표를 기다린다.
  const start = focusPlaceId
    ? focusPlace.data
      ? { lat: focusPlace.data.lat, lng: focusPlace.data.lng }
      : null
    : origin;

  // 기준점 확정 시 최초 검색 1회 (렌더 중 파생 — 린트가 지적하면 파생값 방식으로 전환)
  if (start && search === null) {
    setSearch({ ...start, radiusM: INITIAL_RADIUS_M, category });
    if (focusPlaceId) setSelectedId(focusPlaceId);
  }

  const places = useQueryNearbyPlaces(search);

  const handleViewportChange = useCallback((next: MapViewport) => {
    setViewport(next);
    setMoved(true);
  }, []);

  // 현위치 버튼 — 재측위 후 지도 이동 + 그 자리 재검색
  const previousOrigin = useRef(origin);
  useEffect(() => {
    if (!origin || previousOrigin.current === origin) return;
    previousOrigin.current = origin;
    setFlyTo({ ...origin, key: Date.now() });
    setSearch((prev) => ({
      ...origin,
      radiusM: prev?.radiusM ?? INITIAL_RADIUS_M,
      category,
    }));
    setMoved(false);
  }, [origin, category]);

  const searchHere = useCallback(
    (nextCategory: PlaceCategory | null) => {
      const base = viewport ?? search ?? { ...SEOUL_CITY_HALL, radiusM: INITIAL_RADIUS_M };
      setSearch({
        lat: base.lat,
        lng: base.lng,
        radiusM: "radiusM" in base ? base.radiusM : INITIAL_RADIUS_M,
        category: nextCategory,
      });
      setMoved(false);
      setSelectedId(null);
    },
    [viewport, search],
  );

  const handleCategoryChange = useCallback(
    (next: PlaceCategory | null) => {
      setCategory(next);
      searchHere(next); // 칩 변경은 현재 화면 기준 즉시 재검색
    },
    [searchHere],
  );

  if (!start) {
    return <Skeleton className="m-4 h-96" />;
  }

  const list = places.data ?? [];
  const selected = list.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="relative flex-1">
      <PlaceMap
        initialCenter={start}
        flyTo={flyTo}
        places={list}
        selectedId={selectedId}
        onSelectPlace={setSelectedId}
        onViewportChange={handleViewportChange}
        className="absolute inset-0"
      />

      <div className="absolute inset-x-0 top-0 pt-safe-top">
        <CategoryChips value={category} onChange={handleCategoryChange} />
        {moved && (
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full shadow-md"
              loading={places.isFetching}
              onClick={() => searchHere(category)}
            >
              <LuRotateCw aria-hidden /> 이 지역 재검색
            </Button>
          </div>
        )}
      </div>

      <Drawer open modal={false} dismissible={false} snapPoints={[0.22, 0.8]}>
        <DrawerContent aria-label="주변 장소 목록">
          <DrawerHeader className="py-2">
            {/* aria-live — 재검색 결과 수 변화를 보조기기에 알린다(스펙 §6) */}
            <DrawerTitle aria-live="polite" className="text-sm text-muted-foreground">
              {places.isError
                ? "주변 장소"
                : selected
                  ? selected.name
                  : `근처 ${list.length}곳`}
            </DrawerTitle>
          </DrawerHeader>
          {places.isError ? (
            <ErrorState
              code={APP_MESSAGE_CODE.place.nearbyFailed}
              onRetry={() => places.refetch()}
            />
          ) : places.isPending ? (
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : list.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              이 지역에는 아직 등록된 곳이 없어요
            </p>
          ) : selected ? (
            <PlaceRow place={selected} />
          ) : (
            <ul className="overflow-y-auto">
              {list.map((place) => (
                <li key={place.id}>
                  <PlaceRow place={place} />
                </li>
              ))}
            </ul>
          )}
        </DrawerContent>
      </Drawer>

      <Button
        size="icon"
        variant="secondary"
        aria-label="현재 위치로"
        className="absolute right-4 bottom-40 rounded-full shadow-md"
        onClick={refreshPosition}
      >
        <LuLocateFixed aria-hidden />
      </Button>
    </div>
  );
}

export function MapView() {
  // useSearchParams(place 포커스)는 Suspense 경계가 필수다
  return (
    <Suspense fallback={<Skeleton className="m-4 h-96" />}>
      <MapContent />
    </Suspense>
  );
}
```

import 목록에 `Suspense`(react)·`useSearchParams`(next/navigation)·`useEffect`·`useRef`·`useQueryPlace`·`type LatLng` 를 추가한다.

주의: `if (origin && search === null) setSearch(...)` 는 렌더 중 setState — React 가 허용하는 "렌더 중 파생 상태 갱신" 패턴이지만 react-hooks/set-state-in-effect 류 린트에 걸리면 `useEffect` 로 옮기지 말고 **초기 검색을 `useQueryNearbyPlaces(origin && !search ? {...} : search)` 형태의 파생값으로 바꾼다**(pet-edit 의 교훈 — 린트 결과를 보고 결정).

- [ ] **Step 11: 라우트 확인**

`src/app/(tabs)/map/page.tsx` 는 그대로 — Suspense 경계는 MapView 안에 있다(`place` 포커스 파라미터의 useSearchParams 때문에 필수).

- [ ] **Step 12: 전체 검증 + Commit**

Run: `npm run typecheck && npm run lint && npm run test && npm run build`
Expected: 전부 통과

```bash
git add src/views/map/ "src/app/(tabs)/map/page.tsx"
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#48): 지도 화면 조립 — 칩·바텀시트·재검색·현위치 (TDD)/Claude"
```

---

### Task 9: views/place-detail — 상세 화면 (TDD)

**Files:**
- Modify: `src/views/place-detail/index.tsx` (placeholder 교체)
- Create: `src/views/place-detail/place-info.tsx`
- Test: `src/views/place-detail/place-info.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성** (`place-info.test.tsx`)

```tsx
// 상세 정보 블록 — tel: 링크·전화 결측 숨김·상태 표기
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PlaceDetail } from "@/entities/place";
import { PlaceInfo } from "./place-info";

const place: PlaceDetail = {
  id: "p1",
  category: "animal_hospital",
  status: "operating",
  name: "별별동물병원",
  road_address: "서울 중구 어딘가로 1",
  jibun_address: "서울 중구 어딘가동 1",
  phone: "02-000-0000",
  lat: 37.5,
  lng: 127,
};

describe("PlaceInfo", () => {
  it("이름·카테고리·영업 상태·주소를 그린다", () => {
    render(<PlaceInfo place={place} />);
    expect(
      screen.getByRole("heading", { name: "별별동물병원" }),
    ).toBeInTheDocument();
    expect(screen.getByText("병원")).toBeInTheDocument();
    expect(screen.getByText("영업 중")).toBeInTheDocument();
    expect(screen.getByText("서울 중구 어딘가로 1")).toBeInTheDocument();
  });

  it("전화번호는 tel: 링크다 — 탭하면 바로 전화", () => {
    render(<PlaceInfo place={place} />);
    expect(
      screen.getByRole("link", { name: /02-000-0000/ }),
    ).toHaveAttribute("href", "tel:02-000-0000");
  });

  it("전화 결측이면 전화 행 자체가 없다", () => {
    render(<PlaceInfo place={{ ...place, phone: null }} />);
    expect(screen.queryByRole("link", { name: /전화/ })).toBeNull();
  });

  it("휴업은 경고 톤으로 표기한다", () => {
    render(<PlaceInfo place={{ ...place, status: "suspended" }} />);
    expect(screen.getByText("휴업")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/views/place-detail/place-info.test.tsx`
Expected: FAIL — `Cannot find module './place-info'`

- [ ] **Step 3: 정보 블록 구현** (`place-info.tsx`)

```tsx
// 상세 정보 블록 — 이름·태그·상태·정보 행·후기 그릇 (스펙 §3). 순수 표시 컴포넌트.
import Link from "next/link";
import { LuMapPin, LuPhone } from "react-icons/lu";
import { PLACE_CATEGORY, type PlaceDetail } from "@/entities/place";
import { cn } from "@/shared/lib/utils";

const STATUS_BADGE = {
  operating: { label: "영업 중", className: "text-success" },
  suspended: { label: "휴업", className: "text-warning" },
  closed: { label: "폐업", className: "text-muted-foreground" },
} as const;

export function PlaceInfo({ place }: { place: PlaceDetail }) {
  const category = PLACE_CATEGORY[place.category];
  const status = STATUS_BADGE[place.status];
  const mapHref = `/map?place=${place.id}`; // 지도 탭에서 이 장소 포커스(스펙 §3)
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="font-heading text-xl font-bold">{place.name}</h1>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold",
              category.chipClass,
            )}
          >
            <category.Icon aria-hidden className="size-3" />
            {category.label}
          </span>
          <span className={cn("text-xs font-bold", status.className)}>
            {status.label}
          </span>
        </div>
      </div>

      <dl className="flex flex-col overflow-hidden rounded-xl border border-border">
        <div className="flex items-start gap-3 border-b border-border p-3">
          <LuMapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <dt className="sr-only">주소</dt>
            <dd className="text-sm">{place.road_address ?? place.jibun_address ?? "주소 정보 없음"}</dd>
            {place.road_address && place.jibun_address && (
              <dd className="mt-0.5 text-xs text-muted-foreground">
                지번 · {place.jibun_address}
              </dd>
            )}
          </div>
        </div>
        {place.phone && (
          <a
            href={`tel:${place.phone}`}
            className="flex min-h-11 items-center gap-3 border-b border-border p-3"
          >
            <LuPhone aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium text-primary-emphasis">
              {place.phone}
            </span>
          </a>
        )}
        <Link
          href={mapHref}
          prefetch={false}
          className="flex min-h-11 items-center gap-3 p-3"
        >
          <LuMapPin aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm">지도에서 보기</span>
        </Link>
      </dl>

      {/* 후기 그릇 — M4 에서 채운다. 그릇을 먼저 두는 건 스키마 원칙과 같은 결. */}
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        후기 — 준비 중
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/views/place-detail/place-info.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: 화면 조립** (`index.tsx` 교체)

```tsx
// 장소 상세 화면 (/place?id=) — 미니 지도 + 정보 블록 (스펙 §3)
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryPlace } from "@/entities/place";
import { MiniMap } from "@/widgets/place-map";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { PlaceInfo } from "./place-info";

function PlaceDetailContent() {
  // Static Export 라 동적 세그먼트 대신 쿼리 파라미터 (docs/router.md)
  const placeId = useSearchParams().get("id") ?? undefined;
  const place = useQueryPlace(placeId);

  // 잘못된 접근과 없는 장소는 같은 문구 — 존재 여부를 유출하지 않는다.
  if (!placeId || place.data === null) {
    return <ErrorState code={APP_MESSAGE_CODE.place.notFound} className="mt-16" />;
  }
  if (place.isError) {
    return (
      <ErrorState
        code={APP_MESSAGE_CODE.place.detailLoadFailed}
        onRetry={() => place.refetch()}
        className="mt-16"
      />
    );
  }
  if (place.isPending) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* 미니 지도 탭 → 지도 탭에서 이 장소 포커스 (스펙 §3) */}
      <Link
        href={`/map?place=${place.data.id}`}
        prefetch={false}
        aria-label="지도에서 보기"
      >
        <MiniMap
          lat={place.data.lat}
          lng={place.data.lng}
          category={place.data.category}
          className="h-44 w-full"
        />
      </Link>
      <PlaceInfo place={place.data} />
    </div>
  );
}

export function PlaceDetailView() {
  // useSearchParams 는 Suspense 경계가 필수다 (missing-suspense-with-csr-bailout)
  return (
    <Suspense fallback={<Skeleton className="m-4 h-96" />}>
      <PlaceDetailContent />
    </Suspense>
  );
}
```

- [ ] **Step 6: 전체 검증 + Commit**

Run: `npm run typecheck && npm run lint && npm run test && npm run build`
Expected: 전부 통과 (19개 라우트 정상)

```bash
git add src/views/place-detail/
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#48): 장소 상세 — 미니 지도·정보 행·tel 링크 (TDD)/Claude"
```

---

### Task 10: 브라우저 실측 + E2E + CI 키

**Files:**
- Create: `e2e/map.spec.ts`
- Modify: `.github/workflows/ci.yml` (e2e env 에 NEXT_PUBLIC_KAKAO_MAP_KEY)

- [ ] **Step 1: CI 에 카카오 키 변수 등록** (JS 키는 도메인 보호되는 공개 설계값 — repo variable 로 둔다)

```bash
gh variable set NEXT_PUBLIC_KAKAO_MAP_KEY --body "$(grep '^NEXT_PUBLIC_KAKAO_MAP_KEY=' .env.local | cut -d= -f2)"
```

ci.yml 의 e2e job env 블록에 추가:

```yaml
          NEXT_PUBLIC_KAKAO_MAP_KEY: ${{ vars.NEXT_PUBLIC_KAKAO_MAP_KEY }}
```

- [ ] **Step 2: dev 서버 브라우저 실측** — 프리뷰로 `/map` 열어 확인: 지도 타일 렌더, 핀 5색+글리프, 칩 토글 시 재검색, 지도 드래그 → 재검색 버튼, 바텀시트 드래그, 행 탭 → 상세, 상세 미니 지도·tel 링크. 라이트/다크 모두. 문제는 코드 수정 후 재확인.

- [ ] **Step 3: E2E 작성** (`e2e/map.spec.ts`)

```tsx
// 지도 화면 E2E — 게스트 접근, SDK 로드, 칩·시트 구조, 접근성
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { scanWcag } from "./a11y";

test.describe("지도 화면", () => {
  test.beforeEach(async ({ context }) => {
    // 위치 권한 거부 상태로 고정 — 서울시청 폴백 경로를 테스트한다(결정적).
    await context.grantPermissions([]);
  });

  test("게스트도 지도와 칩·바텀시트를 본다", async ({ page }) => {
    await page.goto("/map");
    await expect(
      page.getByRole("radiogroup", { name: "장소 종류 필터" }),
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: "전체" })).toBeVisible();
    // SDK 가 로드되면 지도 타일 img 가 생긴다 — 키·도메인 등록의 실검증.
    await expect
      .poll(async () => page.locator("#__next, body").locator("img[src*='daumcdn']").count(), {
        timeout: 15_000,
      })
      .toBeGreaterThan(0);
    // 폴백 검색 결과 — 서울시청 3km 는 시딩 실측상 200+곳
    await expect(page.getByText(/근처 \d+곳/)).toBeVisible({ timeout: 15_000 });
  });

  test("칩 단일 선택 토글", async ({ page }) => {
    await page.goto("/map");
    const hospital = page.getByRole("radio", { name: "병원" });
    await hospital.click();
    await expect(hospital).toHaveAttribute("aria-checked", "true");
    await hospital.click();
    await expect(hospital).toHaveAttribute("aria-checked", "false");
  });

  test("접근성 — 지도 화면 라이트/다크", async ({ page }) => {
    await page.goto("/map");
    await page.getByText(/근처 \d+곳/).waitFor({ timeout: 15_000 });
    await scanWcag(page);
  });

  test("상세 — 잘못된 id 는 notFound 문구", async ({ page }) => {
    await page.goto("/place?id=00000000-0000-0000-0000-000000000000");
    await expect(page.getByText("장소를 찾을 수 없어요")).toBeVisible();
  });

  test("상세 — 실데이터 한 곳의 정보·tel 링크", async ({ page, request }) => {
    // 원장에서 전화 있는 영업 중 장소 하나를 anon REST 로 집는다(공개 읽기).
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const response = await request.get(
      `${url}/rest/v1/places?select=id,name,phone&status=eq.operating&phone=not.is.null&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    const [row] = (await response.json()) as Array<{
      id: string;
      name: string;
      phone: string;
    }>;
    await page.goto(`/place?id=${row.id}`);
    await expect(page.getByRole("heading", { name: row.name })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(row.phone) }))
      .toHaveAttribute("href", `tel:${row.phone}`);
    await scanWcag(page);
  });
});
```

주의: `scanWcag` 시그니처는 `e2e/a11y.ts` 실물을 확인해 맞춘다(라이트/다크 처리 방식 포함). 지도 타일 셀렉터(`img[src*='daumcdn']`)는 실측 후 실제 DOM 에 맞게 조정한다 — 추측으로 세 번 고치지 말고 브라우저에서 한 번 찍어본다.

- [ ] **Step 4: E2E 실행**

Run: `npm run build && npx playwright test e2e/map.spec.ts`
Expected: 전부 통과 (로컬은 .env.local 키 사용)

- [ ] **Step 5: Commit**

```bash
git add e2e/map.spec.ts .github/workflows/ci.yml
git commit --author="Claude <noreply@anthropic.com>" -m "test(#48): 지도·상세 E2E — SDK 실로드·칩 토글·axe·tel 링크/Claude"
```

---

### Task 11: 문서·검증·PR

- [ ] **Step 1: README 진행 상황 갱신** — M3 에 지도 화면·장소 상세 항목 체크(핵심 수치·패턴 요약).

- [ ] **Step 2: docs/router.md 갱신** — `/place?id=` 쿼리 라우트 실제 사용 기록(pet-edit 패턴 재사용).

- [ ] **Step 3: `/verify` 전체**

Run: `npm run typecheck && npm run format:check && npm run lint && npm run build && npm run test && npm run test:e2e`
Expected: 전부 통과

- [ ] **Step 4: `/pr` 플로우** — 이슈 #48 완료 코멘트(스크린샷 포함), **지호님이 명시적으로 요청하면** push, `gh pr create --base dev`(Closes #48), CI·CodeRabbit 감시. 푸시는 승인 없이 하지 않는다([git-convention](../conventions/git-convention.md)). 에뮬레이터 실측(WebView 도메인·현위치 권한)은 머지 전 지호님과 함께.
