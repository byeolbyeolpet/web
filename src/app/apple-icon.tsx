// iOS 홈 화면용 apple-touch-icon을 빌드 시점에 생성한다(브랜드 마크 재사용).
import { ImageResponse } from "next/og";

// Static Export에선 아이콘 라우트를 정적으로 못박아야 한다.
export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// icon.svg와 동일한 별 두 개(크림·테라코타). 배경 스퀘어클은 iOS가 마스킹하므로 뺀다.
const STAR =
  "M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z";
const markSvg =
  `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">` +
  `<path d="${STAR}" transform="translate(18 28) scale(2.25)" fill="#F7F2EC"/>` +
  `<path d="${STAR}" transform="translate(60 18) scale(1.05)" fill="#E8825C"/>` +
  `</svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2E5D5A",
        }}
      >
        <img
          width={140}
          height={140}
          src={`data:image/svg+xml;utf8,${encodeURIComponent(markSvg)}`}
        />
      </div>
    ),
    size,
  );
}
