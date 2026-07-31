// 펫 행(PetCard) 검증 — 성별 표기 생략 규칙과 링크/비링크 렌더 분기.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PetListItem } from "../api/use-query-pets";
import { PetCard } from "./pet-card";

const pet: PetListItem = {
  id: "pet-1",
  name: "코코",
  sex: "female",
  species: { code: "ferret", name_ko: "페럿" },
};

describe("PetCard", () => {
  it("이름·성별·종을 보여준다", () => {
    render(<PetCard pet={pet} />);

    expect(screen.getByText("코코")).toBeInTheDocument();
    expect(screen.getByText("암컷")).toBeInTheDocument();
    expect(screen.getByText("페럿")).toBeInTheDocument();
  });

  it("성별이 unknown 이면 그 줄을 아예 렌더하지 않는다", () => {
    render(<PetCard pet={{ ...pet, sex: "unknown" }} />);

    expect(screen.getByText("코코")).toBeInTheDocument();
    expect(screen.queryByText("모름")).not.toBeInTheDocument();
  });

  it("종 아이콘을 주입받아 렌더한다", () => {
    // entities/pet 은 entities/species 를 import 할 수 없어 아이콘을 주입받는다.
    render(<PetCard pet={pet} speciesIcon={<span>아이콘</span>} />);

    expect(screen.getByText("아이콘")).toBeInTheDocument();
  });

  it("li 를 렌더하지 않는다 — 목록 시맨틱은 호출부가 갖는다", () => {
    const { container } = render(<PetCard pet={pet} />);

    expect(container.querySelector("li")).toBeNull();
  });
});
