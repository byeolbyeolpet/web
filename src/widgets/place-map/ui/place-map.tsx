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
import { PIN_SIZE, placePinDataUrl } from "../lib/marker-svg";
import { useKakaoMaps } from "../lib/use-kakao-maps";

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
  flyTo,
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

  // 콜백 최신값 참조 — 지도 이벤트 리스너는 한 번만 등록한다.
  // 렌더 중 ref 쓰기는 금지(react-hooks/refs) — 무의존 effect 로 매 렌더 후 갱신.
  const callbacksRef = useRef({ onSelectPlace, onViewportChange });
  useEffect(() => {
    callbacksRef.current = { onSelectPlace, onViewportChange };
  });

  // 지도 생성 (SDK ready 후 1회). initialCenter 는 이름 그대로 최초값만 쓴다.
  const initialCenterRef = useRef(initialCenter);
  useEffect(() => {
    if (status !== "ready" || !containerRef.current || mapRef.current) return;
    const map = new kakao.maps.Map(containerRef.current, {
      center: new kakao.maps.LatLng(
        initialCenterRef.current.lat,
        initialCenterRef.current.lng,
      ),
      level: 5, // 반경 1~2km 급 — 초기 검색 반경과 비슷한 체감
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
  }, [status]);

  // flyTo — 같은 좌표로도 다시 이동할 수 있게 key 로 변화를 식별한다
  useEffect(() => {
    if (!mapRef.current || !flyTo) return;
    mapRef.current.setCenter(new kakao.maps.LatLng(flyTo.lat, flyTo.lng));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key 가 변화의 전부다
  }, [flyTo?.key]);

  // 마커 동기화 — places·selectedId 가 바뀌면 다시 그린다
  useEffect(() => {
    const clusterer = clustererRef.current;
    if (status !== "ready" || !mapRef.current || !clusterer) return;

    clusterer.clear();
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
      return marker;
    });
    clusterer.addMarkers(markers);
  }, [places, selectedId, status]);

  if (status === "error") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <ErrorState
          code={APP_MESSAGE_CODE.place.mapLoadFailed}
          onRetry={retry}
        />
      </div>
    );
  }

  return (
    // isolate — 카카오 내부 레이어의 양수 z-index(실측 z:1 svg)가 바깥 오버레이
    // (칩·버튼, z-auto) 위로 올라오지 못하게 스태킹 컨텍스트를 가둔다.
    <div className={cn("relative isolate", className)}>
      {status === "loading" && <Skeleton className="absolute inset-0" />}
      {/* 지도 자체는 스크린리더에 소음이라 숨긴다 — 동등한 접근 경로는 바텀시트 리스트다(스펙 §6) */}
      <div ref={containerRef} className="size-full" aria-hidden />
    </div>
  );
}
