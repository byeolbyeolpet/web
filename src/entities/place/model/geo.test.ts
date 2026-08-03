// geo 유틸 — 반경 계산(haversine)·거리 표기
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatDistance, haversineMeters } from "./geo";

describe("haversineMeters", () => {
  it("같은 점은 0", () => {
    const p = { lat: 37.5665, lng: 126.978 };
    expect(haversineMeters(p, p)).toBe(0);
  });

  it("서울시청→광화문 약 1km (±15%)", () => {
    const cityHall = { lat: 37.5665, lng: 126.978 };
    const gwanghwamun = { lat: 37.5759, lng: 126.9769 };
    const d = haversineMeters(cityHall, gwanghwamun);
    expect(d).toBeGreaterThan(890);
    expect(d).toBeLessThan(1210); // 실좌표 기준 약 1.05km — 지리 근사 허용
  });
});

describe("formatDistance", () => {
  it("1km 미만은 m 단위 정수", () => {
    expect(formatDistance(0)).toBe("0m");
    expect(formatDistance(999.4)).toBe("999m");
  });

  it("1km 이상은 km 소수 1자리", () => {
    expect(formatDistance(1000)).toBe("1.0km");
    expect(formatDistance(1234)).toBe("1.2km");
    expect(formatDistance(12340)).toBe("12.3km");
  });
});
