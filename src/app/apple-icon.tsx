// iOS 홈 화면용 apple-touch-icon을 빌드 시점에 생성한다(브랜드 마크 재사용).
import { ImageResponse } from "next/og";

// Static Export에선 아이콘 라우트를 정적으로 못박아야 한다.
export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// icon.svg와 동일한 발자국 마크(크림 + 테라코타 액센트 1). 배경 스퀘어클은 iOS가 마스킹하므로 뺀다.
const markSvg =
  `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">` +
  `<ellipse cx="28" cy="42" rx="8.5" ry="11" fill="#F7F2EC"/>` +
  `<ellipse cx="41.5" cy="31" rx="8.5" ry="11.5" fill="#F7F2EC"/>` +
  `<ellipse cx="58.5" cy="31" rx="8.5" ry="11.5" fill="#E8825C"/>` +
  `<ellipse cx="72" cy="42" rx="8.5" ry="11" fill="#F7F2EC"/>` +
  `<ellipse cx="50" cy="66" rx="19" ry="15.5" fill="#F7F2EC"/>` +
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
