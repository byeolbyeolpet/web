// 바텀시트의 장소 목록 — 가상 스크롤. 보이는 행만 DOM 에 올린다.
//
// RPC 상한(200)이 1차 방어지만 목록 자체도 상한에 기대지 않게 한다. 상한을 올리거나
// 겸업 병합으로 행이 늘어도 DOM 은 화면에 보이는 만큼만 유지된다.
// 행 높이가 고정(PLACE_ROW_HEIGHT)이라 측정 없이 위치를 계산할 수 있다 —
// 주소 줄바꿈으로 높이가 흔들리던 것을 먼저 잡은 이유이기도 하다.
"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { NearbyPlace } from "@/entities/place";
import { PLACE_ROW_HEIGHT, PlaceRow } from "./place-row";

/** 화면 밖으로 미리 그려 두는 행 수 — 빠른 플링에서 빈 칸이 보이지 않을 만큼만 */
const OVERSCAN = 6;

export function PlaceList({ places }: { places: NearbyPlace[] }) {
  // useVirtualizer 는 렌더마다 새 함수를 돌려줘 React Compiler 가 안전하게
  // 메모이즈할 수 없다(react-hooks/incompatible-library). 이 컴포넌트만 컴파일에서
  // 뺀다 — 어차피 가상 스크롤이 렌더 비용을 줄이는 쪽이라 손해가 없다.
  "use no memo";

  const scrollRef = useRef<HTMLDivElement>(null);
  // 위 "use no memo" 로 컴파일에서 뺐지만 린트 규칙은 호출 지점을 계속 짚는다.
  // eslint-disable-next-line react-hooks/incompatible-library -- 의도적 이탈
  const virtualizer = useVirtualizer({
    count: places.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => PLACE_ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">
      {/* 전체 높이를 잡아 스크롤바가 실제 목록 길이를 나타내게 한다 */}
      <ul
        style={{ height: virtualizer.getTotalSize() }}
        className="relative w-full"
      >
        {virtualizer.getVirtualItems().map((item) => (
          <li
            key={places[item.index].id}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${item.start}px)`,
            }}
          >
            <PlaceRow place={places[item.index]} />
          </li>
        ))}
      </ul>
    </div>
  );
}
