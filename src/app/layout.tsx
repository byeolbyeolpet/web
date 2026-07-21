import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Nunito } from "next/font/google";
import "./globals.css";
import { cn } from "@/shared/lib/utils";

/** 본문 — 한글. 400/500/700만 쓴다. */
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

/** 제목 — 영문·숫자. 말단이 둥근 인문주의 산세리프. 한글은 Noto Sans KR로 폴백된다. */
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "별별펫 — 별의별 반려동물이 다 여기에",
    template: "%s | 별별펫",
  },
  description:
    "강아지·고양이부터 고슴도치·페럿·파충류까지. 병원·미용·호텔 지도, 동네 커뮤니티, 반려동물 사전, 성분 분석을 한곳에. 종을 가리지 않는 반려 생활 허브.",
  applicationName: "별별펫",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* 실수 줌은 줄이되 확대 자체는 막지 않는다. maximumScale=1은 접근성 위반이다. */
  maximumScale: 5,
  /* 노치 영역까지 배경을 채우고 Safe Area는 CSS 토큰으로 처리한다. */
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f2ec" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={cn(
        "h-full",
        "antialiased",
        notoSansKr.variable,
        nunito.variable,
        "font-sans",
      )}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
