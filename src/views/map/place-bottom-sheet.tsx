// 지도 바텀시트 — 접힘/펼침 2스냅 커스텀 시트.
//
// vaul(Radix Dialog 기반)을 쓰지 않는 이유: vaul 은 modal prop 을 Radix Root 에
// 전달하지 않아(1.1.2 소스 실측) 항상 모달로 동작한다 — 비모달 상시 시트에서
// 앱 전체 aria-hidden + body pointer-events:none 이 걸린다. 포털 없는 순수 div 라
// 그 문제 계열이 원천적으로 없고, 지도 컨테이너 안에 있어 탭바를 덮지 않는다.
"use client";

import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/shared/lib/utils";

/** 접힌 높이 — 핸들·제목 + 행 두 개가 살짝 보이는 정도 */
const COLLAPSED_PX = 176;
/** 펼친 높이 — 지도 컨테이너 기준. 위쪽 칩 열이 보이도록 남긴다 */
const EXPANDED_RATIO = 0.78;
/** 이만큼 끌면 스냅이 넘어간다 */
const DRAG_THRESHOLD_PX = 60;
/** 이만큼 움직여야 "탭"이 아니라 "드래그"로 본다 */
const DRAG_START_PX = 4;

type PlaceBottomSheetProps = {
  title: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PlaceBottomSheet({
  title,
  children,
  className,
}: PlaceBottomSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const [dragDelta, setDragDelta] = useState<number | null>(null);
  const startRef = useRef<{ y: number; expanded: boolean } | null>(null);

  // 포인터 캡처는 "실제로 끌기 시작한 뒤"에만 잡는다.
  // pointerdown 에서 바로 잡으면 캡처 대상이 이 div 가 되어 안쪽 button 의 click 이
  // 발생하지 않는다 — 탭으로 펼치기가 죽는다(브라우저 실측. jsdom 은 이 API 가
  // 없어 setup 의 빈 구현으로 대체되므로 유닛 테스트로는 절대 안 잡힌다).
  const capturing = useRef(false);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    startRef.current = { y: event.clientY, expanded };
    capturing.current = false;
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!startRef.current) return;
    const delta = event.clientY - startRef.current.y;
    if (!capturing.current) {
      if (Math.abs(delta) < DRAG_START_PX) return; // 탭의 미세한 흔들림은 무시
      event.currentTarget.setPointerCapture(event.pointerId);
      capturing.current = true;
    }
    setDragDelta(delta);
  };
  const onPointerEnd = () => {
    capturing.current = false;
    if (!startRef.current) return;
    const delta = dragDelta ?? 0;
    // 위로 끌면(음수) 펼치고, 아래로 끌면 접는다. 문턱 미만이면 원래 상태 유지.
    setExpanded(
      startRef.current.expanded
        ? delta < DRAG_THRESHOLD_PX
        : delta < -DRAG_THRESHOLD_PX,
    );
    startRef.current = null;
    setDragDelta(null);
  };

  const dragging = dragDelta !== null;
  const delta = Math.round(dragDelta ?? 0);
  // 접힘: 위로 끌면(-delta) 커지고 아래로는 안 줄어든다. 펼침: 아래로 끌면 줄어든다.
  // 접힘에서 위로 계속 끌면 -delta 가 무한정 커진다. 상한을 안 걸면 드래그 중
  // 시트가 지도를 넘어 상단 칩 열까지 덮는다(손을 떼면 스냅으로 복구되긴 한다).
  const height = expanded
    ? `calc(${EXPANDED_RATIO * 100}% - ${Math.max(0, delta)}px)`
    : `min(${EXPANDED_RATIO * 100}%, ${Math.max(COLLAPSED_PX, COLLAPSED_PX - delta)}px)`;

  return (
    <section
      aria-label="주변 장소 목록"
      style={{ height }}
      className={cn(
        "absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-t-xl border-t border-border bg-card shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.15)]",
        !dragging && "transition-[height] duration-300 ease-out",
        className,
      )}
    >
      {/* 드래그 핸들 겸 토글 버튼 — 드래그 없이 탭·키보드로도 조작된다 */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className="touch-none select-none"
      >
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? "목록 접기" : "목록 펼치기"}
          onClick={() => setExpanded((prev) => !prev)}
          className="flex min-h-11 w-full flex-col items-center justify-center gap-2 pt-2"
        >
          <span aria-hidden className="h-1 w-9 rounded-full bg-border" />
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {title}
          </span>
        </button>
      </div>
      {/* 스크롤은 내용이 가져간다 — 목록은 가상 스크롤이라 자기 스크롤 컨테이너가
          필요하고, 여기서 한 번 더 스크롤하면 컨테이너가 중첩된다. */}
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}
