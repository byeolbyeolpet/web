// 접근성 스캔 공용 — guest·authenticated 두 spec 이 같이 쓴다.

import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

/**
 * wcag22aa 는 2.2 의 target-size(2.5.8, **24px 기준**)를 돌리기 위해 넣는다.
 * 우리 규칙인 44×44px(CLAUDE.md)는 이보다 엄격해서 axe 가 대신 보증해 주지
 * 않는다 — 24px 미달이라는 명백한 붕괴만 걸러 주는 안전망이고, 44px 는
 * 코드 리뷰와 실측이 지킨다(CodeRabbit 지적으로 정정).
 */
export const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
];

/**
 * 등장 애니메이션이 끝날 때까지 기다린다.
 *
 * **이게 없으면 color-contrast 가 산발적으로 실패한다.** 목록이 stagger 로 하나씩
 * fade-in 하는데, 그 도중의 반투명 카드는 배경과 섞여 실제보다 낮은 대비로 계산된다.
 * 실패 대상이 매번 li:nth-child(1) → (3) 으로 옮겨 다닌 것이 단서였다 — 색이 아니라
 * 타이밍이다.
 *
 * 여기 오기까지 틀린 길이 셋 있었고, 각각 이유가 다르다. 다시 밟지 않게 남긴다.
 *
 *   1. `reducedMotion: "reduce"` — motion 의 reducedMotion 은 transform·layout 만
 *      끄고 **opacity 는 의도적으로 계속 재생한다**(전정기관 이슈와 무관하다는 판단).
 *   2. `document.getAnimations()` 로 판정 — stagger 라 뒤쪽 항목은 아직 애니메이션이
 *      **생성조차 안 된 상태**다. 없는 것은 "끝났다"로 읽혀 그냥 통과한다.
 *   3. 인라인 `style.opacity` 로 판정 — motion 은 애니메이션 중 인라인 값을 초기값
 *      그대로 두고 computed 만 올린다. 게다가 Radix RadioGroup 의 숨은 native input
 *      은 `opacity: 0` 으로 영구히 남아 영원히 정착하지 않는다.
 *
 * 그래서 **computed opacity** 를 보고, 대상에 `li` 를 항상 포함시킨다. 셀렉터를
 * `[style*='opacity']` 하나로 두면 motion 이 스타일을 붙이기 전 찰나에 대상이 0개가
 * 되고, **빈 배열의 `every()` 는 true** 라 그대로 통과해 버린다.
 *
 * `aria-hidden` 은 제외한다 — Radix 의 숨은 input 이 여기 해당하고, 그것들은 axe 의
 * 대비 검사 대상도 아니다.
 */
export async function waitForEntranceToSettle(page: Page) {
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll<HTMLElement>("li, [style*='opacity']"))
      .filter((el) => el.getAttribute("aria-hidden") !== "true")
      .every((el) => parseFloat(getComputedStyle(el).opacity) === 1),
  );
}

/** WCAG A·AA 위반을 사람이 읽을 수 있는 형태로 돌려준다. */
export async function scanWcag(page: Page) {
  await waitForEntranceToSettle(page);

  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();

  // 규칙 id 만 보이면 어디를 고쳐야 할지 모른다 — 대상까지 남긴다.
  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    targets: v.nodes.map((n) => n.target.join(" ")),
  }));
}

/** 대비만 따로 본다. 테마별로 값이 달라 화면마다 라이트·다크를 각각 봐야 한다. */
export async function scanContrast(page: Page) {
  await waitForEntranceToSettle(page);

  // withRules 와 withTags 는 둘 다 runOnly 를 세팅해 나중 호출이 앞을 덮는다.
  // 대비만 보려는 것이므로 withRules 하나만 쓴다.
  const { violations } = await new AxeBuilder({ page })
    .withRules(["color-contrast"])
    .analyze();

  return violations.flatMap((v) =>
    v.nodes.map((n) => `${n.target.join(" ")} — ${n.failureSummary}`),
  );
}
