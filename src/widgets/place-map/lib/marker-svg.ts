// 물방울 핀 SVG — 카테고리 색 + 흰 글리프. MarkerImage 는 CSS 를 못 읽어
// data URI 로 굽는다. 크기 값은 MarkerImage 의 Size/offset 과 함께 쓴다.
export const PIN_SIZE = {
  base: { width: 28, height: 36 },
  selected: { width: 38, height: 49 },
} as const;

export function placePinDataUrl(options: {
  color: string;
  glyph: string;
}): string {
  // viewBox 28x36 — 꼬리 끝(14,36)이 좌표점. offset 은 (width/2, height).
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 36">` +
    `<path d="M14 0C6.3 0 0 6.3 0 14c0 9.6 14 22 14 22s14-12.4 14-22C28 6.3 21.7 0 14 0Z" ` +
    `fill="${options.color}" stroke="#ffffff" stroke-width="1.5"/>` +
    `<text x="14" y="18.5" text-anchor="middle" font-size="11" font-weight="700" ` +
    `fill="#ffffff" font-family="sans-serif">${options.glyph}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
