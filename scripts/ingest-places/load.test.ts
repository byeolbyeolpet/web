// load 단위 테스트 — chunk 분할 (네트워크 경로는 시딩 실행에서 실물 검증)
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { chunk } from "./load";

describe("chunk", () => {
  it("지정 크기로 나눈다", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("빈 배열은 빈 결과다", () => {
    expect(chunk([], 500)).toEqual([]);
  });
});
