import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RadioCard, RadioCards } from "./radio-cards";

describe("RadioCards", () => {
  it("radiogroup 과 radio 시맨틱으로 렌더된다", () => {
    render(
      <RadioCards aria-label="종">
        <RadioCard value="dog">강아지</RadioCard>
        <RadioCard value="cat">고양이</RadioCard>
      </RadioCards>,
    );

    expect(screen.getByRole("radiogroup", { name: "종" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("선택하면 onValueChange 로 값을 올려보낸다", async () => {
    const onValueChange = vi.fn();
    render(
      <RadioCards aria-label="종" onValueChange={onValueChange}>
        <RadioCard value="dog">강아지</RadioCard>
        <RadioCard value="cat">고양이</RadioCard>
      </RadioCards>,
    );

    await userEvent.click(screen.getByRole("radio", { name: "고양이" }));

    expect(onValueChange).toHaveBeenCalledWith("cat");
  });
});
