// 홈 대시보드 화면.
import Link from "next/link";
import { ScreenPlaceholder } from "@/shared/ui/screen-placeholder";

export function HomeView() {
  return (
    <>
      <ScreenPlaceholder title="별별펫" />
      {/* [임시] #28 저장소 프로브 진입 링크 — 검증 후 삭제한다. */}
      <Link
        href="/storage-probe"
        className="p-4 text-center text-xs text-muted-foreground underline"
      >
        [임시] 저장소 프로브 (#28)
      </Link>
    </>
  );
}
