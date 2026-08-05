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
    script.onload = () => {
      // 도메인 미등록 등에서 카카오는 스크립트를 200 으로 주고 내부에서만 실패한다.
      // 그러면 onerror 가 안 뜨고 window.kakao 도 없어서, 여기서 막지 않으면
      // 이 Promise 밖에서 TypeError 가 나 reject 가 안 불리고 status 가 loading 에
      // 고착된다 — 재시도 버튼조차 안 나온다.
      if (!window.kakao?.maps?.load) {
        script.remove();
        sdkPromise = null;
        reject(new Error("카카오맵 SDK 초기화 실패 — kakao 전역이 없다"));
        return;
      }
      window.kakao.maps.load(resolve);
    };
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
  // 초기값이 이미 loading — effect 는 비동기 킥만 하고 setState 는 promise
  // 콜백에서만 일어난다(react-hooks/set-state-in-effect 회피, 실측 지적).
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  const attempt = useCallback(() => {
    loadSdk().then(
      () => setStatus("ready"),
      (error) => {
        console.error("[place-map] SDK 로드 실패", error);
        setStatus("error");
      },
    );
  }, []);

  // 재시도는 이벤트 핸들러 컨텍스트라 동기 setState 가 허용된다.
  const retry = useCallback(() => {
    setStatus("loading");
    attempt();
  }, [attempt]);

  useEffect(() => {
    attempt();
  }, [attempt]);

  return { status, retry };
}
