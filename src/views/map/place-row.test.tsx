// 바텀시트 장소 행 — 이름·태그·거리·상세 링크
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { NearbyPlace } from "@/entities/place";
import { PlaceRow } from "./place-row";

const place: NearbyPlace = {
  id: "p1",
  external_id: "x",
  category: "animal_hospital",
  status: "operating",
  name: "별별동물병원",
  road_address: "서울 중구 어딘가로 1",
  jibun_address: null,
  phone: null,
  lat: 37.5,
  lng: 127,
  distance_m: 321.4,
};

describe("PlaceRow", () => {
  it("이름·카테고리·거리·주소를 그리고 상세로 링크한다", () => {
    render(<PlaceRow place={place} />);
    const link = screen.getByRole("link", { name: /별별동물병원/ });
    expect(link).toHaveAttribute("href", "/place?id=p1");
    expect(screen.getByText("병원")).toBeInTheDocument();
    expect(screen.getByText("321m")).toBeInTheDocument();
    expect(screen.getByText("서울 중구 어딘가로 1")).toBeInTheDocument();
  });

  it("주소 결측이면 주소 줄을 그리지 않는다", () => {
    render(<PlaceRow place={{ ...place, road_address: null }} />);
    expect(screen.queryByText(/서울 중구/)).toBeNull();
  });
});
