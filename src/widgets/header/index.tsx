// (tabs) 셸 상단 헤더 — 워드마크 + 계정. 크롬은 무채색으로 비운다(색은 CTA·활성 탭에만).
//
// 페이지 제목은 넣지 않는다. 하단 탭이 이미 현재 위치를 말하고 있어 같은 말을
// 두 번 하게 되고, 워드마크가 화면에서 사라진다. (full) 화면은 본문 상단의
// PageHeading 이 그 역할을 한다.
import { cn } from "@/shared/lib/utils";
import { ProfileMenu } from "./profile-menu";

// 헤더 높이. 하단 탭(min-h-14=56px)보다 낮춰 상·하 크롬의 위계를 준다.
const HEADER_HEIGHT = "min-h-12";

export function Header({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "flex items-center gap-2 border-b border-border bg-card px-4 pt-safe-top select-none",
        HEADER_HEIGHT,
        className,
      )}
    >
      {/*
       * 워드마크. 그래픽 심볼은 #18 에서 확정되면 이 span 왼쪽에 붙는다.
       * gap-2 로 자리를 미리 잡아 심볼이 들어와도 레이아웃이 흔들리지 않는다.
       */}
      <span className="font-heading text-lg font-bold tracking-tight text-foreground">
        별별펫
      </span>
      {/* 서버 컴포넌트인 헤더 안의 클라이언트 섬. 세션을 읽어야 하는 건 여기뿐이라
          헤더 전체를 클라이언트로 내리지 않는다. */}
      <ProfileMenu />
    </header>
  );
}

// (full) 셸 헤더도 같은 계정 진입점을 쓴다 — 헤더는 셸의 일부라 화면마다
// 있다 없다 하면 안 된다. 깊은 경로 import 를 막기 위해 여기서 재노출한다.
export { ProfileMenu } from "./profile-menu";
