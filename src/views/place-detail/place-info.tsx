// 상세 정보 블록 — 이름·태그·상태·정보 행·후기 그릇 (스펙 §3). 순수 표시 컴포넌트.
import Link from "next/link";
import { LuMapPin, LuPhone } from "react-icons/lu";
import { PLACE_CATEGORY, type PlaceDetail } from "@/entities/place";
import { cn } from "@/shared/lib/utils";

const STATUS_BADGE = {
  operating: { label: "영업 중", className: "text-success" },
  suspended: { label: "휴업", className: "text-warning" },
  closed: { label: "폐업", className: "text-muted-foreground" },
} as const;

export function PlaceInfo({ place }: { place: PlaceDetail }) {
  const category = PLACE_CATEGORY[place.category];
  const status = STATUS_BADGE[place.status];
  const mapHref = `/map?place=${place.id}`; // 지도 탭에서 이 장소 포커스(스펙 §3)
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="font-heading text-xl font-bold">{place.name}</h1>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold",
              category.chipClass,
            )}
          >
            <category.Icon aria-hidden className="size-3" />
            {category.label}
          </span>
          <span className={cn("text-xs font-bold", status.className)}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-border">
        <div className="flex items-start gap-3 border-b border-border p-3">
          <LuMapPin
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          />
          <div className="min-w-0">
            <p className="text-sm">
              {place.road_address ?? place.jibun_address ?? "주소 정보 없음"}
            </p>
            {place.road_address && place.jibun_address && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                지번 · {place.jibun_address}
              </p>
            )}
          </div>
        </div>
        {place.phone && (
          <a
            href={`tel:${place.phone}`}
            className="flex min-h-11 items-center gap-3 border-b border-border p-3"
          >
            <LuPhone
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span className="text-sm font-medium text-primary-emphasis">
              {place.phone}
            </span>
          </a>
        )}
        <Link
          href={mapHref}
          prefetch={false}
          className="flex min-h-11 items-center gap-3 p-3"
        >
          <LuMapPin
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
          <span className="text-sm">지도에서 보기</span>
        </Link>
      </div>

      {/* 후기 그릇 — M4 에서 채운다. 그릇을 먼저 두는 건 스키마 원칙과 같은 결. */}
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        후기 — 준비 중
      </div>
    </div>
  );
}
