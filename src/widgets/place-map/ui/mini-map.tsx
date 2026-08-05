// 상세 화면의 위치 미니 지도 — 조작 잠금, 핀 하나 (스펙 §3)
"use client";

import { useEffect, useRef } from "react";
import { PLACE_CATEGORY, type PlaceCategory } from "@/entities/place";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { PIN_SIZE, placePinDataUrl } from "../lib/marker-svg";
import { useKakaoMaps } from "../lib/use-kakao-maps";

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
    const container = containerRef.current;
    if (status !== "ready" || !container) return;
    const position = new kakao.maps.LatLng(lat, lng);
    const map = new kakao.maps.Map(container, {
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
        {
          offset: new kakao.maps.Point(
            PIN_SIZE.base.width / 2,
            PIN_SIZE.base.height,
          ),
        },
      ),
    }).setMap(map);
    requestAnimationFrame(() => map.relayout());

    // deps 가 바뀌면 지도를 새로 만든다. 카카오가 주입한 이전 DOM 을 비우지 않으면
    // 컨테이너 안에 지도가 겹쳐 쌓인다.
    return () => container.replaceChildren();
  }, [status, lat, lng, category]);

  // 미니 지도는 보조 시각 정보 — 실패해도 주소 텍스트가 있어 화면은 성립한다.
  if (status === "error") return null;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {status === "loading" && <Skeleton className="absolute inset-0" />}
      {/* 장식용 잠금 지도 — inert 로 카카오 내부 포커스까지 막는다(aria-hidden 만
          쓰면 안의 포커스 가능한 링크가 aria-hidden-focus 위반, axe 실측).
          탭 동작은 이 컴포넌트를 감싸는 바깥 Link 가 맡는다. */}
      <div ref={containerRef} className="size-full" aria-hidden inert />
    </div>
  );
}
