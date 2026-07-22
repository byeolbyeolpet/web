// 재시도 판단 로직 검증 — Supabase 계층마다 다른 에러 형태를 모두 걸러내는지 확인한다.
import { describe, expect, it } from "vitest";
import { shouldRetry } from "./query-provider";

/** 실제 형태를 흉내 낸 에러를 만든다. Supabase 는 Error 에 필드를 얹어 던진다. */
function makeError(props: Record<string, unknown>): Error {
  return Object.assign(new Error("test"), props);
}

describe("shouldRetry", () => {
  it("응답을 받지 못한 네트워크 오류는 재시도한다", () => {
    expect(shouldRetry(0, new Error("Failed to fetch"))).toBe(true);
    expect(shouldRetry(1, new Error("Failed to fetch"))).toBe(true);
  });

  it("재시도 횟수를 넘기면 멈춘다", () => {
    expect(shouldRetry(2, new Error("Failed to fetch"))).toBe(false);
  });

  it("PostgrestError(code 보유)는 재시도하지 않는다 — DB 까지 도달해 거부된 것", () => {
    // RLS 거부. status 는 없고 code 만 있는 형태.
    expect(shouldRetry(0, makeError({ code: "42501" }))).toBe(false);
    // 없는 리소스
    expect(shouldRetry(0, makeError({ code: "PGRST116" }))).toBe(false);
  });

  it("숫자 status 4xx(Auth·Functions 계열)는 재시도하지 않는다", () => {
    expect(shouldRetry(0, makeError({ status: 401 }))).toBe(false);
    expect(shouldRetry(0, makeError({ status: 403 }))).toBe(false);
    expect(shouldRetry(0, makeError({ status: 404 }))).toBe(false);
  });

  it("서버 오류(5xx)는 일시적일 수 있으므로 재시도한다", () => {
    expect(shouldRetry(0, makeError({ status: 500 }))).toBe(true);
    expect(shouldRetry(0, makeError({ status: 503 }))).toBe(true);
  });
});
