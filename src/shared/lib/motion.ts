// motion 공용 프리셋 — 화면마다 duration·ease 를 새로 정하지 않는다.
//
// **접근성은 여기서 다루지 않는다.** AppProviders 의
// `<MotionConfig reducedMotion="user">` 가 전역으로 처리하므로 컴포넌트마다
// useReducedMotion 을 붙이지 않는다.
//
// **CSS 로 되는 전환은 CSS 로 한다.** 높이·색·투명도처럼 단순한 것은
// `transition-*` 유틸이 더 가볍고, globals.css 의 prefers-reduced-motion
// 가드도 그대로 먹는다. motion 은 CSS 가 못 하는 것에만 쓴다 —
// 순차 등장(stagger), 화면 전환, 제스처, 레이아웃 이동.
//
// **Radix 컴포넌트를 AnimatePresence 로 감싸지 않는다.** RadioGroup 을 감쌌을 때
// exit 가 완료되지 않아 항목이 DOM 에 남고 클릭이 막히는 것을 확인했다(#34).
// 그런 자리의 접기·펼치기는 `grid-template-rows: 0fr → 1fr` CSS 트릭을 쓴다.

// **`motion.div` 가 아니라 `m.div` 를 쓴다.** AppProviders 가 LazyMotion 을
// strict 로 켜 둬서 `motion.*` 은 런타임 에러가 난다. 전체 motion 은 JS 를
// 287KB 늘리는데 domAnimation 세트로 좁히면 213KB 다(실측, 비압축 기준).

import type { Transition, Variants } from "motion/react";

/** iOS·토스 계열 감속 곡선. 처음 빠르고 끝이 부드럽다. */
export const MOTION_EASE = [0.32, 0.72, 0, 1] as const;

export const MOTION_DURATION = {
  fast: 0.16,
  base: 0.22,
  slow: 0.32,
} as const;

export const motionTransition: Transition = {
  duration: MOTION_DURATION.base,
  ease: MOTION_EASE,
};

/**
 * 아래에서 살짝 올라오며 나타난다. 폼 필드·목록 항목의 기본 등장.
 * y 를 8px 로 짧게 두는 이유: 이동이 크면 화면이 출렁이는 인상이 된다.
 */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: motionTransition },
};

/** 자식(riseIn)을 순차로 등장시킨다. 부모에 걸고 자식에 riseIn 을 준다. */
export const riseInList: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
