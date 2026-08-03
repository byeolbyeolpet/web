// parse 단위 테스트 — cp949 디코드 + 헤더 키 파싱 (스펙 §2)
// @vitest-environment node
import { encode } from "iconv-lite";
import { describe, expect, it } from "vitest";
import { parseCsvBuffer } from "./parse";

describe("parseCsvBuffer", () => {
  it("cp949 CSV 를 헤더 키 객체로 파싱한다", () => {
    const csv =
      "관리번호,사업장명,영업상태명\r\n3220000-1,별별동물병원,영업/정상\r\n";
    const rows = parseCsvBuffer(encode(csv, "cp949"));
    expect(rows).toEqual([
      {
        관리번호: "3220000-1",
        사업장명: "별별동물병원",
        영업상태명: "영업/정상",
      },
    ]);
  });

  it("UTF-8 BOM 파일도 처리한다 — 갱신본 인코딩이 바뀌는 경우의 안전망", () => {
    // BOM 은 보이지 않아 리터럴로 넣으면 리뷰가 불가능하다 — 이스케이프로 명시한다.
    const csv = "\uFEFF관리번호,사업장명\r\n3220000-2,별별약국\r\n";
    const rows = parseCsvBuffer(Buffer.from(csv, "utf-8"));
    expect(rows).toEqual([{ 관리번호: "3220000-2", 사업장명: "별별약국" }]);
  });

  it("따옴표 안의 쉼표를 필드로 쪼개지 않는다", () => {
    const csv = '관리번호,사업장명\r\n3220000-3,"별별펫, 토탈케어"\r\n';
    const rows = parseCsvBuffer(encode(csv, "cp949"));
    expect(rows[0]?.["사업장명"]).toBe("별별펫, 토탈케어");
  });
});
