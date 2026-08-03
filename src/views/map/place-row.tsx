// 바텀시트 리스트의 장소 행 — 탭하면 상세로 (스펙 §1)
import Link from "next/link";
import {
  PLACE_CATEGORY,
  formatDistance,
  type NearbyPlace,
} from "@/entities/place";
import { cn } from "@/shared/lib/utils";

export function PlaceRow({ place }: { place: NearbyPlace }) {
  const category = PLACE_CATEGORY[place.category];
  return (
    <Link
      href={`/place?id=${place.id}`}
      prefetch={false}
      className="flex min-h-14 flex-col justify-center gap-0.5 border-b border-border px-4 py-2"
    >
      <span className="flex items-center gap-2">
        <span className="font-heading text-sm font-bold">{place.name}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold",
            category.chipClass,
          )}
        >
          <category.Icon aria-hidden className="size-3" />
          {category.label}
        </span>
      </span>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {formatDistance(place.distance_m)}
        </span>
        {place.road_address && <span>{place.road_address}</span>}
      </span>
    </Link>
  );
}
