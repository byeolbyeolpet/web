// jsdom 에서 axe-core 를 돌려 구조적 접근성 위반을 잡는 헬퍼.
//
// **이 층이 존재하는 이유는 로그인 때문이다.** 우리 인증은 Google OAuth 뿐이라
// E2E 가 세션을 만들 수 없고, 그래서 등록 폼·마이처럼 정작 접근성 작업이 몰린
// 화면에 브라우저 axe 가 닿지 못한다. 컴포넌트를 직접 렌더해서 검사한다.
//
// **무엇을 못 잡는지 분명히 한다.** jsdom 에는 레이아웃 엔진이 없어 색·크기·
// 가시성이 계산되지 않는다. color-contrast, target-size 류는 violation 이
// 아니라 incomplete 로 빠진다 — 그건 e2e/accessibility.spec.ts 의 몫이다.
// 여기서 보는 것은 라벨·역할·aria 관계처럼 DOM 만으로 판정되는 것들이다.

import axe, { type RunOptions, type Result } from "axe-core";

/** DOM 만으로 판정 가능한 규칙 집합. 레이아웃이 필요한 규칙은 브라우저가 본다. */
const JSDOM_RUN_OPTIONS: RunOptions = {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a"] },
  rules: {
    // 레이아웃이 없으면 전부 incomplete 라 켜 둬도 의미가 없다.
    "color-contrast": { enabled: false },
    // 컴포넌트 단위 렌더에는 페이지 랜드마크가 없는 게 정상이다.
    region: { enabled: false },
  },
};

/** 위반을 사람이 읽을 수 있는 줄로 편다 — 실패 메시지에 규칙 id 만 남으면 못 고친다. */
export function formatViolations(violations: Result[]): string[] {
  return violations.flatMap((violation) =>
    violation.nodes.map(
      (node) => `${violation.id}: ${node.target.join(" ")} — ${violation.help}`,
    ),
  );
}

/** container 를 axe 로 검사하고 위반을 읽기 좋은 문자열 배열로 돌려준다. */
export async function findA11yViolations(
  container: Element,
): Promise<string[]> {
  const { violations } = await axe.run(container, JSDOM_RUN_OPTIONS);
  return formatViolations(violations);
}
