// 현위치 1회 획득 — 거부·실패 시 서울시청 폴백 + 토스트 (스펙 §1·§7)
// Capacitor WebView 의 권한 동작은 에뮬레이터에서 실측한다(#48 완료 조건).
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LatLng } from "@/entities/place";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppError } from "@/shared/lib/app-toast";

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
