// transform 단위 테스트 — 좌표 변환 앵커·상태 매핑·스킵 사유 (스펙 §3)
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { transformRow } from "./transform";

/** 유효한 영업 중 행. 좌표는 EPSG:5174 원점(x_0=200000, y_0=500000) = lat 38 / lng 127.0029 부근. */
function record(
  overrides: Record<string, string> = {},
): Record<string, string> {
  return {
    관리번호: "3220000-곧은-2026-0001",
    사업장명: "별별동물병원",
    도로명주소: "서울특별시 어딘가로 1",
    지번주소: "서울특별시 어딘가동 1",
    전화번호: "02-000-0000",
    "좌표정보(X)": "200000",
    "좌표정보(Y)": "500000",
    영업상태명: "영업/정상",
    ...overrides,
  };
}

describe("transformRow", () => {
  it("영업 행을 upsert 행으로 바꾸고 좌표를 WGS84로 변환한다 (원점 앵커)", () => {
    const result = transformRow(record(), "animal_hospital");
    expect(result.kind).toBe("upsert");
    if (result.kind !== "upsert") return;
    // EPSG:5174 정의상 투영 원점(200000, 500000)은 lat_0=38 / lon_0=127.00289.
    // towgs84 데이텀 보정으로 수백 m 이동하므로 소수 1자리 근사로 잡는다.
    expect(result.row.lat).toBeCloseTo(38.0, 1);
    expect(result.row.lng).toBeCloseTo(127.0029, 1);
    expect(result.row).toMatchObject({
      source: "localdata",
      external_id: "3220000-곧은-2026-0001",
      category: "animal_hospital",
      status: "operating",
      name: "별별동물병원",
    });
  });

  it("휴업은 suspended 로 매핑한다", () => {
    const result = transformRow(record({ 영업상태명: "휴업" }), "grooming");
    expect(result.kind).toBe("upsert");
    if (result.kind === "upsert") expect(result.row.status).toBe("suspended");
  });

  it.each(["폐업", "취소/말소/만료/정지/중지"])(
    "%s 는 closed 마커가 된다 — 신규로 넣지 않고 기존 행만 전환(스펙 §4-2)",
    (status) => {
      const result = transformRow(record({ 영업상태명: status }), "pharmacy");
      expect(result).toEqual({
        kind: "closed",
        externalId: "3220000-곧은-2026-0001",
      });
    },
  );

  it("미지의 영업상태는 조용히 operating 이 되지 않고 스킵된다", () => {
    const result = transformRow(
      record({ 영업상태명: "듣도보도못한상태" }),
      "funeral",
    );
    expect(result).toEqual({ kind: "skip", reason: "unknown_status" });
  });

  it("빈 영업상태도 스킵된다", () => {
    expect(transformRow(record({ 영업상태명: "" }), "funeral")).toEqual({
      kind: "skip",
      reason: "unknown_status",
    });
  });

  it("좌표 결측·비수치는 스킵된다", () => {
    expect(transformRow(record({ "좌표정보(X)": "" }), "boarding")).toEqual({
      kind: "skip",
      reason: "missing_coord",
    });
    expect(transformRow(record({ "좌표정보(Y)": "abc" }), "boarding")).toEqual({
      kind: "skip",
      reason: "missing_coord",
    });
  });

  it("변환 결과가 한국 상자 밖이면 변환 오류로 스킵된다", () => {
    // y=2,000,000m 는 원점에서 북쪽으로 1,500km — 위도가 39를 훌쩍 넘는다.
    const result = transformRow(
      record({ "좌표정보(Y)": "2000000" }),
      "boarding",
    );
    expect(result).toEqual({ kind: "skip", reason: "coord_out_of_bounds" });
  });

  it("관리번호·사업장명 결측은 스킵된다", () => {
    expect(transformRow(record({ 관리번호: " " }), "boarding")).toEqual({
      kind: "skip",
      reason: "missing_required",
    });
    expect(transformRow(record({ 사업장명: "" }), "boarding")).toEqual({
      kind: "skip",
      reason: "missing_required",
    });
  });

  it("빈 주소·전화는 null 로 정규화한다", () => {
    const result = transformRow(
      record({ 도로명주소: " ", 전화번호: "" }),
      "animal_hospital",
    );
    expect(result.kind).toBe("upsert");
    if (result.kind === "upsert") {
      expect(result.row.road_address).toBeNull();
      expect(result.row.phone).toBeNull();
    }
  });
});
