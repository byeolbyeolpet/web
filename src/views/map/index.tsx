// 지도 화면 — 카카오맵 + 카테고리 칩 + 바텀시트 리스트 + 재검색 (스펙 §1)
"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LuLocateFixed, LuMinus, LuPlus, LuRotateCw } from "react-icons/lu";
import {
  NEARBY_LIMIT,
  useQueryNearbyPlaces,
  useQueryPlace,
  type LatLng,
  type NearbySearchParams,
  type PlaceCategory,
} from "@/entities/place";
import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { Button } from "@/shared/ui/button";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  PlaceMap,
  type MapViewport,
  type PlaceMapHandle,
} from "@/widgets/place-map";
import { CategoryChips } from "./category-chips";
import { PlaceBottomSheet } from "./place-bottom-sheet";
import { PlaceList } from "./place-list";
import { PlaceRow } from "./place-row";
import { SEOUL_CITY_HALL, useCurrentPosition } from "./use-current-position";

const INITIAL_RADIUS_M = 3000;

function MapContent() {
  // 상세의 "지도에서 보기" 가 /map?place=<id> 로 들어온다 — 그 장소를 포커스한다.
  const focusPlaceId = useSearchParams().get("place") ?? undefined;
  const focusPlace = useQueryPlace(focusPlaceId);

  const {
    position: origin,
    refresh: refreshPosition,
    isFallback,
  } = useCurrentPosition();
  const [category, setCategory] = useState<PlaceCategory | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 검색 기준(쿼리 파라미터)과 지도의 현재 뷰포트는 분리 — 재검색 버튼이 잇는다.
  const [search, setSearch] = useState<NearbySearchParams | null>(null);
  const [viewport, setViewport] = useState<MapViewport | null>(null);
  const [moved, setMoved] = useState(false);
  const [flyTo, setFlyTo] = useState<(LatLng & { key: number }) | null>(null);
  const mapHandle = useRef<PlaceMapHandle | null>(null);

  // 시작 기준점: 포커스 장소 > 현위치. 포커스 파라미터가 있으면 그 좌표를 기다리되,
  // 조회가 끝났는데 좌표가 없으면(에러·없는 id) 현위치로 내려온다 — 안 그러면
  // start 가 영영 null 이라 지도는 스켈레톤, 검색은 enabled:false 로 멈춘다.
  const focusResolved = focusPlace.isSuccess || focusPlace.isError;
  const start = focusPlaceId
    ? focusPlace.data
      ? { lat: focusPlace.data.lat, lng: focusPlace.data.lng }
      : focusResolved
        ? origin
        : null
    : origin;

  // 기준점 확정 시 최초 검색 1회 — 렌더 중 파생 상태 갱신 패턴.
  if (start && search === null) {
    setSearch({ ...start, radiusM: INITIAL_RADIUS_M, category });
    if (focusPlaceId) setSelectedId(focusPlaceId);
  }

  const places = useQueryNearbyPlaces(search);

  const handleViewportChange = useCallback((next: MapViewport) => {
    setViewport(next);
    setMoved(true);
  }, []);

  // 현위치 버튼 — 재측위 결과가 오면 지도 이동 + 그 자리 재검색.
  // 마운트 시의 자동 측위는 여기서 제외한다. /map?place=<id> 로 들어온 사용자는
  // 그 장소를 보러 온 것인데, 측위가 성공하든 5초 뒤 폴백이 오든 origin 이 채워져
  // 지도를 현위치로 끌고 가 버린다(포커스 이탈). 버튼을 눌렀을 때만 따라간다.
  const followsPosition = useRef(!focusPlaceId);
  // 배너는 렌더에 영향을 주므로 state 로 따로 둔다(ref 는 리렌더를 일으키지 않는다).
  const [showsFallbackNotice, setShowsFallbackNotice] = useState(!focusPlaceId);
  const handleLocate = useCallback(() => {
    followsPosition.current = true;
    setShowsFallbackNotice(true);
    refreshPosition();
  }, [refreshPosition]);

  const previousOrigin = useRef(origin);
  useEffect(() => {
    if (!origin || previousOrigin.current === origin) return;
    previousOrigin.current = origin;
    if (!followsPosition.current) return;
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
      const base = viewport ??
        search ?? { ...SEOUL_CITY_HALL, radiusM: INITIAL_RADIUS_M };
      setSearch({
        lat: base.lat,
        lng: base.lng,
        radiusM: base.radiusM,
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

  const list = places.data ?? [];
  const selected = list.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="relative flex-1">
      {/* 칩·시트는 위치 확정에 인질 잡히지 않는다 — 지도 슬롯만 기다린다
          (Playwright 실측: 위치 폴백은 5초 타임아웃 뒤에야 온다). */}
      {start ? (
        <PlaceMap
          handleRef={mapHandle}
          initialCenter={start}
          flyTo={flyTo}
          places={list}
          selectedId={selectedId}
          onSelectPlace={setSelectedId}
          onViewportChange={handleViewportChange}
          className="absolute inset-0"
        />
      ) : (
        <Skeleton className="absolute inset-0" />
      )}

      <div className="absolute inset-x-0 top-0 z-10 pt-safe-top">
        <CategoryChips value={category} onChange={handleCategoryChange} />
        {/* 위치 폴백 안내 — 토스트는 칩을 4초간 덮어 포인터를 가로챈다(E2E 실측).
            상태 정보라 상주 배너가 맞고, 현위치 버튼으로 재시도하면 사라진다.
            포커스 진입(/map?place=)에는 안 띄운다 — 화면은 그 장소를 보여주고
            있는데 "서울 시청 기준" 이라고 하면 거짓말이다(스냅샷 실측). */}
        {isFallback && showsFallbackNotice && (
          <p className="mx-4 mt-1 w-fit rounded-lg bg-card/95 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
            {APP_MESSAGE[APP_MESSAGE_CODE.place.locationFallback].description}
          </p>
        )}
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

      <PlaceBottomSheet
        title={
          places.isError
            ? "주변 장소"
            : selected
              ? selected.name
              : // 상한에 걸리면 "+" 를 붙인다 — 200곳이라고만 하면 그게 전부라는 거짓말이다.
                `근처 ${list.length}곳${list.length >= NEARBY_LIMIT ? "+" : ""}`
        }
      >
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
          <PlaceList places={list} />
        )}
      </PlaceBottomSheet>

      {/* 지도 조작 묶음 — 시트(접힘 176px) 위로 띄운다 */}
      <div className="absolute right-4 bottom-52 z-10 flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          aria-label="지도 확대"
          className="rounded-full shadow-md"
          onClick={() => mapHandle.current?.zoomIn()}
        >
          <LuPlus aria-hidden />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          aria-label="지도 축소"
          className="rounded-full shadow-md"
          onClick={() => mapHandle.current?.zoomOut()}
        >
          <LuMinus aria-hidden />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          aria-label="현재 위치로"
          className="rounded-full shadow-md"
          onClick={handleLocate}
        >
          <LuLocateFixed aria-hidden />
        </Button>
      </div>
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
