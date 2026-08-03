// 장소 상세 화면 (/place?id=) — 미니 지도 + 정보 블록 (스펙 §3)
"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryPlace } from "@/entities/place";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { MiniMap } from "@/widgets/place-map";
import { PlaceInfo } from "./place-info";

function PlaceDetailContent() {
  // Static Export 라 동적 세그먼트 대신 쿼리 파라미터 (docs/router.md)
  const placeId = useSearchParams().get("id") ?? undefined;
  const place = useQueryPlace(placeId);

  // 잘못된 접근과 없는 장소는 같은 문구 — 존재 여부를 유출하지 않는다.
  if (!placeId || place.data === null) {
    return (
      <ErrorState code={APP_MESSAGE_CODE.place.notFound} className="mt-16" />
    );
  }
  if (place.isError) {
    return (
      <ErrorState
        code={APP_MESSAGE_CODE.place.detailLoadFailed}
        onRetry={() => place.refetch()}
        className="mt-16"
      />
    );
  }
  if (place.isPending) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* 미니 지도 탭 → 지도 탭에서 이 장소 포커스 (스펙 §3) */}
      <Link
        href={`/map?place=${place.data.id}`}
        prefetch={false}
        aria-label="지도에서 보기"
      >
        <MiniMap
          lat={place.data.lat}
          lng={place.data.lng}
          category={place.data.category}
          className="h-44 w-full"
        />
      </Link>
      <PlaceInfo place={place.data} />
    </div>
  );
}

export function PlaceDetailView() {
  // useSearchParams 는 Suspense 경계가 필수다 (missing-suspense-with-csr-bailout)
  return (
    <Suspense fallback={<Skeleton className="m-4 h-96" />}>
      <PlaceDetailContent />
    </Suspense>
  );
}
