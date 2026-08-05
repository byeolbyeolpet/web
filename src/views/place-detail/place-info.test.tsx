// 상세 정보 블록 — tel: 링크·전화 결측 숨김·상태 표기
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PlaceDetail } from "@/entities/place";
import { PlaceInfo } from "./place-info";

const place: PlaceDetail = {
  id: "p1",
  category: "animal_hospital",
  status: "operating",
  name: "별별동물병원",
  road_address: "서울 중구 어딘가로 1",
  jibun_address: "서울 중구 어딘가동 1",
  phone: "02-000-0000",
  lat: 37.5,
  lng: 127,
};

describe("PlaceInfo", () => {
  it("이름·카테고리·영업 상태·주소를 그린다", () => {
    render(<PlaceInfo place={place} />);
    expect(
      screen.getByRole("heading", { name: "별별동물병원" }),
    ).toBeInTheDocument();
    expect(screen.getByText("병원")).toBeInTheDocument();
    expect(screen.getByText("영업 중")).toBeInTheDocument();
    expect(screen.getByText("서울 중구 어딘가로 1")).toBeInTheDocument();
  });

  it("전화번호는 tel: 링크다 — 탭하면 바로 전화", () => {
    render(<PlaceInfo place={place} />);
    expect(screen.getByRole("link", { name: /02-000-0000/ })).toHaveAttribute(
      "href",
      "tel:02-000-0000",
    );
  });

  it("전화 결측이면 전화 행 자체가 없다", () => {
    render(<PlaceInfo place={{ ...place, phone: null }} />);
    // 링크의 접근 가능한 이름은 전화번호 그 자체다. /전화/ 로 찾으면 전화 행이
    // 되살아나도 이 테스트는 통과해 버린다 — 실제 이름으로 부재를 확인한다.
    expect(screen.queryByRole("link", { name: /02-000-0000/ })).toBeNull();
    expect(document.querySelector('a[href^="tel:"]')).toBeNull();
  });

  it("휴업은 경고 톤으로 표기한다", () => {
    render(<PlaceInfo place={{ ...place, status: "suspended" }} />);
    expect(screen.getByText("휴업")).toBeInTheDocument();
  });
});
