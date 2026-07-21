// 사전 상세 라우트 (/dex/:slug) — 빌드 SSG. 데이터 붙기 전 샘플 slug로 뼈대만.
import { DexDetailView } from "@/views/dex-detail";

export function generateStaticParams() {
  return [{ slug: "sample" }];
}

export default function Page() {
  return <DexDetailView />;
}
