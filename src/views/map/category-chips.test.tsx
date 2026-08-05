// 카테고리 칩 — 단일 선택 토글 (같은 칩 재탭 = 해제)
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CategoryChips } from "./category-chips";

describe("CategoryChips", () => {
  it("전체 + 5업종 칩을 그린다", () => {
    render(<CategoryChips value={null} onChange={vi.fn()} />);
    for (const label of ["전체", "병원", "미용", "호텔", "약국", "장묘"]) {
      expect(screen.getByRole("radio", { name: label })).toBeInTheDocument();
    }
  });

  it("업종 탭 → 해당 코드", async () => {
    const onChange = vi.fn();
    render(<CategoryChips value={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "병원" }));
    expect(onChange).toHaveBeenLastCalledWith("animal_hospital");
  });

  it("선택된 업종을 다시 탭하면 해제(null)", async () => {
    const onChange = vi.fn();
    render(<CategoryChips value="pharmacy" onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "약국" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
