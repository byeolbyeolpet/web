// 테스트 전역 setup — jest-dom 매처 등록 + jsdom 에 없는 브라우저 API 보충.
import "@testing-library/jest-dom/vitest";

// jsdom 에는 ResizeObserver 가 없다. Radix 의 크기 측정(@radix-ui/react-use-size)이
// 이것을 쓰므로 RadioGroup 같은 컴포넌트를 렌더하면 그대로 터진다.
// 레이아웃 계산이 필요한 검증은 브라우저에서 하므로 여기서는 빈 구현으로 충분하다.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom 은 이미지를 실제로 내려받지 않아 load 이벤트가 영원히 안 온다.
// Radix Avatar 는 로드가 확인된 뒤에만 <img> 를 그리므로(useImageLoadingStatus)
// AvatarImage 가 테스트에서 아예 렌더되지 않는다. Radix 의 판정식이
// `complete && naturalWidth > 0` 이라(dist 소스로 확인) 그 둘만 채워 준다.
class AlwaysLoadedImage extends window.Image {
  constructor() {
    super();
    Object.defineProperty(this, "complete", { value: true });
    Object.defineProperty(this, "naturalWidth", { value: 1 });
  }
}
window.Image = AlwaysLoadedImage;
