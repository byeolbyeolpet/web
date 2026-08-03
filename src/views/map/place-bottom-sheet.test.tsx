// 바텀시트 — 접힘/펼침 토글·시맨틱 (드래그 물리는 브라우저 실측이 맡는다)
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PlaceBottomSheet } from "./place-bottom-sheet";

describe("PlaceBottomSheet", () => {
  it("제목과 내용을 그리고 region 으로 노출된다", () => {
    render(
      <PlaceBottomSheet title="근처 3곳">
        <p>목록</p>
      </PlaceBottomSheet>,
    );
    expect(
      screen.getByRole("region", { name: "주변 장소 목록" }),
    ).toBeInTheDocument();
    expect(screen.getByText("근처 3곳")).toBeInTheDocument();
    expect(screen.getByText("목록")).toBeInTheDocument();
  });

  it("핸들 버튼이 접힘/펼침을 토글한다 — 드래그 없이도 조작 가능(키보드 접근)", async () => {
    render(
      <PlaceBottomSheet title="근처 3곳">
        <p>목록</p>
      </PlaceBottomSheet>,
    );
    const handle = screen.getByRole("button", { name: "목록 펼치기" });
    expect(handle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(handle);
    expect(handle).toHaveAttribute("aria-expanded", "true");
    expect(handle).toHaveAccessibleName("목록 접기");

    await userEvent.click(handle);
    expect(handle).toHaveAttribute("aria-expanded", "false");
  });
});
