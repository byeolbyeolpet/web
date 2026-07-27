import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SpeciesPicker } from "./species-picker";

vi.mock("../api/use-query-species", () => ({
  useQuerySpecies: () => ({
    isPending: false,
    data: [
      { code: "dog", name_ko: "강아지", sort_order: 10 },
      { code: "cat", name_ko: "고양이", sort_order: 20 },
      { code: "ferret", name_ko: "페럿", sort_order: 70 },
    ],
  }),
}));

describe("SpeciesPicker", () => {
  it("받아온 순서 그대로 종을 렌더한다", () => {
    render(<SpeciesPicker aria-label="종" onValueChange={vi.fn()} />);

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(radios.map((r) => r.textContent)).toEqual([
      "강아지",
      "고양이",
      "페럿",
    ]);
  });

  it("value 로 넘긴 종이 선택 상태다", () => {
    render(
      <SpeciesPicker aria-label="종" value="ferret" onValueChange={vi.fn()} />,
    );

    expect(screen.getByRole("radio", { name: "페럿" })).toBeChecked();
  });
});
