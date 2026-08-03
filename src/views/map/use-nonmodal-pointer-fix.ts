// vaul(modal=false) 항상 열림 시트의 body pointer-events 경합 보정.
//
// Radix Dialog 가 마운트 직후 body 에 pointer-events:none 을 깔고, vaul 의
// 복구 rAF(auto)가 그보다 먼저 돌아 경합에서 지면 지도·칩 전체가 터치 불능이
// 된다(브라우저 실측 — 이후 재설정은 없음). 지도 화면은 비모달 시트만 쓰므로
// none 이 정당한 순간이 없다 — 떠 있는 동안 none 이 보이면 즉시 auto 로 되돌린다.
"use client";

import { useEffect } from "react";

export function useNonmodalPointerFix() {
  useEffect(() => {
    const restore = () => {
      if (document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "auto";
      }
    };
    restore();
    const observer = new MutationObserver(restore);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });
    return () => observer.disconnect();
  }, []);
}
