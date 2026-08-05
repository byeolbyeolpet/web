// 전화번호 표시 포맷 — 원장에 실제로 있는 길이(8~11)를 전부 덮는다
import { describe, expect, it } from "vitest";
import { formatPhone } from "./phone";

describe("formatPhone", () => {
  it("서울은 지역번호가 2자리다", () => {
    expect(formatPhone("024745100")).toBe("02-474-5100"); // 9자리, 국번 3
    expect(formatPhone("0222377582")).toBe("02-2237-7582"); // 10자리, 국번 4
  });

  it("그 외 지역번호·이동전화·인터넷전화는 3자리다", () => {
    expect(formatPhone("0512022429")).toBe("051-202-2429");
    expect(formatPhone("07077761105")).toBe("070-7776-1105");
    expect(formatPhone("01012345678")).toBe("010-1234-5678");
  });

  it("0 으로 시작하지 않는 8자리는 대표번호다", () => {
    expect(formatPhone("16881240")).toBe("1688-1240");
  });

  it("이미 구분자가 있어도 숫자만 뽑아 다시 맞춘다", () => {
    expect(formatPhone("051) 202-2429")).toBe("051-202-2429");
  });

  it("규칙 밖 길이는 자르지 않고 숫자열 그대로 둔다 — 틀린 구분자가 더 나쁘다", () => {
    expect(formatPhone("123")).toBe("123");
    expect(formatPhone("051202242900")).toBe("051202242900");
  });

  it("없는 값은 null 이다 — 호출부가 행 자체를 숨긴다", () => {
    expect(formatPhone(null)).toBeNull();
    expect(formatPhone("")).toBeNull();
    expect(formatPhone("문의")).toBeNull();
  });
});
