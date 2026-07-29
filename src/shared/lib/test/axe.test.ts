// 접근성 검사 장치 자체를 검증한다.
//
// 통과만 하는 a11y 테스트는 없는 것보다 나쁘다 — 규칙이 하나도 안 돌아도
// "위반 0건"으로 초록불이 켜지기 때문이다. 여기서 일부러 깨진 DOM 을 넣어
// 검사기가 실제로 잡는지를 못 박는다.

import { afterEach, describe, expect, it } from "vitest";
import { findA11yViolations } from "./axe";

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.append(host);
  return host;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("findA11yViolations", () => {
  it("이름 없는 버튼을 잡는다", async () => {
    const violations = await findA11yViolations(mount("<button></button>"));

    expect(violations.join("\n")).toContain("button-name");
  });

  it("라벨 없는 입력을 잡는다", async () => {
    const violations = await findA11yViolations(mount('<input type="text" />'));

    expect(violations.join("\n")).toContain("label");
  });

  // 마이 화면의 아바타가 원격 <img> 라 이 규칙이 실제로 걸리는 자리다.
  it("대체 텍스트 없는 이미지를 잡는다", async () => {
    const violations = await findA11yViolations(mount('<img src="a.png" />'));

    expect(violations.join("\n")).toContain("image-alt");
  });

  // Button asChild 로 Link 를 감싸는 패턴이 흔해서 중첩이 나기 쉽다.
  it("인터랙티브 요소 중첩을 잡는다", async () => {
    const violations = await findA11yViolations(
      mount("<button>바깥<a href='/x'>안쪽</a></button>"),
    );

    expect(violations.join("\n")).toContain("nested-interactive");
  });

  it("멀쩡한 DOM 에는 위반이 없다", async () => {
    const violations = await findA11yViolations(
      mount('<label for="name">이름</label><input id="name" />'),
    );

    expect(violations).toEqual([]);
  });

  it("위반 메시지에 어디를 고칠지가 담긴다", async () => {
    const [message] = await findA11yViolations(
      mount('<button id="save"></button>'),
    );

    // "규칙 id: 선택자 — 설명" 형태여야 실패 로그만 보고 고칠 수 있다.
    expect(message).toMatch(/^button-name: #save — /);
  });
});
