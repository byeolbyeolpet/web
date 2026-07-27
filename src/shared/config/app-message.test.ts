// APP_MESSAGE 와 APP_MESSAGE_CODE 의 도메인·key 일치 검증 (app-message-convention).
// 타입은 "값이 실재하는 코드인가"까지만 본다. 경로와 값이 어긋나는 것
// (pet.createFailed 자리에 "auth.signInFailed" 를 둔 경우)과 한쪽에만 있는 것은
// 여기서 잡는다.

import { describe, expect, it } from "vitest";
import { APP_MESSAGE, APP_MESSAGE_CODE } from "./app-message";

const entries = Object.entries(APP_MESSAGE_CODE).flatMap(([domain, keys]) =>
  Object.entries(keys).map(([key, code]) => ({ domain, key, code })),
);

describe("APP_MESSAGE_CODE", () => {
  it("코드 값이 자기 경로와 같다", () => {
    for (const { domain, key, code } of entries) {
      expect(code).toBe(`${domain}.${key}`);
    }
  });

  it("APP_MESSAGE 와 코드 집합이 정확히 같다", () => {
    expect(entries.map((e) => e.code).sort()).toEqual(
      Object.keys(APP_MESSAGE).sort(),
    );
  });
});

describe("APP_MESSAGE", () => {
  it("title 은 마침표로 끝나지 않는다 — 짧은 명사형·상태형", () => {
    for (const message of Object.values(APP_MESSAGE)) {
      expect(message.title).not.toMatch(/\.$/);
    }
  });

  it("description 이 있으면 마침표로 끝난다 — 문장형", () => {
    for (const message of Object.values(APP_MESSAGE)) {
      if ("description" in message) {
        expect(message.description).toMatch(/\.$/);
      }
    }
  });
});
