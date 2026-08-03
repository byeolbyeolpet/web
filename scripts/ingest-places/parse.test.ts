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

  // 아래 셋은 구조 오류 행의 처리 계약을 고정한다(스펙 §7, CodeRabbit #45 지적).
  // 짧은/긴 행은 위치가 밀리지 않고(헤더 이름 매핑) 뒤 컬럼만 비거나 잘린다 —
  // 필수(관리번호·사업장명)·좌표 검사가 transform 에서 걸러낸다.
  it("짧은 행은 뒤 컬럼이 빈 채로 나온다 — transform 의 결측 검사가 거른다", () => {
    const csv = "관리번호,사업장명,영업상태명\r\n3220000-4\r\n";
    const rows = parseCsvBuffer(encode(csv, "cp949"));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.["관리번호"]).toBe("3220000-4");
    expect(rows[0]?.["사업장명"] ?? "").toBe("");
  });

  it("긴 행은 초과 값이 잘려 나온다 — 우리 컬럼 값은 밀리지 않는다", () => {
    const csv = "관리번호,사업장명\r\n3220000-5,별별펫,넘치는값\r\n";
    const rows = parseCsvBuffer(encode(csv, "cp949"));
    expect(rows[0]?.["관리번호"]).toBe("3220000-5");
    expect(rows[0]?.["사업장명"]).toBe("별별펫");
  });

  it("닫히지 않은 따옴표는 예외를 던진다 — 파일 단위 중단(스펙 §7)", () => {
    // 구조가 깨진 파일에서 행 복구를 시도하는 것은 잘못된 적재보다 위험하다.
    const csv = '관리번호,사업장명\r\n3220000-6,"안닫힌따옴표\r\n';
    expect(() => parseCsvBuffer(encode(csv, "cp949"))).toThrow();
  });
});
