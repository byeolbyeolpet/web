// 현위치 1회 획득 — 거부·실패 시 서울시청 폴백 (스펙 §1·§7)
//
// 폴백 안내는 토스트가 아니라 화면 내 배너다 — 상단 토스트가 칩 열을 4초간
// 덮어 포인터를 가로챈다(E2E 실측). 상태 정보는 상주 UI 가 맞다.
// Capacitor WebView 의 권한 동작은 에뮬레이터에서 실측한다(#48 완료 조건).
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LatLng } from "@/entities/place";

export const SEOUL_CITY_HALL: LatLng = { lat: 37.5665, lng: 126.978 };

export function useCurrentPosition() {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  // 현위치 버튼이 재호출한다 — 처음 거부했다가 허용한 사용자를 위해 매번 다시 묻는다.
  const refresh = useCallback(() => {
    if (!navigator.geolocation) {
      setIsFallback(true);
      setPosition({ ...SEOUL_CITY_HALL });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsFallback(false);
        setPosition({ lat: coords.latitude, lng: coords.longitude });
      },
      (error) => {
        // 권한 거부는 사용자의 정상적인 선택이라 오류가 아니다. error 로 찍으면
        // dev 오버레이·콘솔 감시가 실패로 센다. 측위 실패(2·3)만 오류로 남긴다.
        const log =
          error.code === error.PERMISSION_DENIED ? console.info : console.error;
        log("[place] 현위치 미획득 — 서울시청 폴백", error.code, error.message);
        setIsFallback(true);
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

  return { position, refresh, isFallback }; // position null = 아직 확인 중
}
