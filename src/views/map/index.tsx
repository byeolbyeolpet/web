// 지도 화면 — 카카오맵 + 카테고리 칩 + 바텀시트 리스트 + 재검색 (스펙 §1)
"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LuLocateFixed, LuRotateCw } from "react-icons/lu";
import {
  useQueryNearbyPlaces,
  useQueryPlace,
  type LatLng,
  type NearbySearchParams,
  type PlaceCategory,
} from "@/entities/place";
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
import { PlaceMap, type MapViewport } from "@/widgets/place-map";
import { CategoryChips } from "./category-chips";
import { PlaceRow } from "./place-row";
import { SEOUL_CITY_HALL, useCurrentPosition } from "./use-current-position";
import { useNonmodalPointerFix } from "./use-nonmodal-pointer-fix";

const INITIAL_RADIUS_M = 3000;

function MapContent() {
  // vaul 비모달 시트의 body pointer-events 경합 보정 — 훅 파일 주석 참고.
  useNonmodalPointerFix();

  // 상세의 "지도에서 보기" 가 /map?place=<id> 로 들어온다 — 그 장소를 포커스한다.
  const focusPlaceId = useSearchParams().get("place") ?? undefined;
  const focusPlace = useQueryPlace(focusPlaceId);

  const { position: origin, refresh: refreshPosition } = useCurrentPosition();
  const [category, setCategory] = useState<PlaceCategory | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 검색 기준(쿼리 파라미터)과 지도의 현재 뷰포트는 분리 — 재검색 버튼이 잇는다.
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

  // 현위치 버튼 — 재측위 결과가 오면 지도 이동 + 그 자리 재검색
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
      const base =
        viewport ?? search ?? { ...SEOUL_CITY_HALL, radiusM: INITIAL_RADIUS_M };
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

      <div className="absolute inset-x-0 top-0 z-10 pt-safe-top">
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
        {/* vaul 의 스냅 오프셋은 화면 높이 기준이라(0.78×vh 실측) 콘텐츠도 화면
            높이(h-dvh)여야 한다 — 기본 max-h-[80vh]면 시트가 화면 밖으로 밀린다.
            bottom-14 는 하단 탭바(56px) 위에 얹기 위한 오프셋. */}
        <DrawerContent
          aria-label="주변 장소 목록"
          className="h-dvh data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-none data-[vaul-drawer-direction=bottom]:bottom-14"
        >
          <DrawerHeader className="py-2">
            {/* aria-live — 재검색 결과 수 변화를 보조기기에 알린다(스펙 §6) */}
            <DrawerTitle
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
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
            <ul className="min-h-0 flex-1 overflow-y-auto pb-4">
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
        className="absolute right-4 bottom-60 z-10 rounded-full shadow-md"
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
