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
