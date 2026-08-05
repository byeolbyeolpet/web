// 바텀시트 리스트의 장소 행 — 탭하면 상세로 (스펙 §1)
import Link from "next/link";
import {
  PLACE_CATEGORY,
  formatDistance,
  type NearbyPlace,
} from "@/entities/place";
import { cn } from "@/shared/lib/utils";

/** 행 높이(px) — 가변이 아니라 상수다. 가상 스크롤의 측정 기준이기도 하다. */
export const PLACE_ROW_HEIGHT = 64;

export function PlaceRow({ place }: { place: NearbyPlace }) {
  const category = PLACE_CATEGORY[place.category];
  return (
    // 높이를 고정한다 — 주소가 길면 줄바꿈되면서 행마다 높이와 터치 영역이
    // 제각각이 됐다(실기기 지적). 넘치는 텍스트는 잘라내고 높이는 64px 로 둔다.
    // flex 자식은 min-w-0 이 없으면 truncate 가 먹지 않는다.
    <Link
      href={`/place?id=${place.id}`}
      prefetch={false}
      style={{ height: PLACE_ROW_HEIGHT }}
      className="flex flex-col justify-center gap-0.5 border-b border-border px-4"
    >
      <span className="flex items-center gap-2">
        <span className="min-w-0 truncate font-heading text-sm font-bold">
          {place.name}
        </span>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold",
            category.chipClass,
          )}
        >
          <category.Icon aria-hidden className="size-3" />
          {category.label}
        </span>
      </span>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="shrink-0 font-medium text-foreground">
          {formatDistance(place.distance_m)}
        </span>
        {place.road_address && (
          <span className="min-w-0 truncate">{place.road_address}</span>
        )}
      </span>
    </Link>
  );
}
