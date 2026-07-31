// 종 선택 그리드 검증 — 순서·선택·접기(collapsible)·실패 상태.

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SpeciesPicker } from "./species-picker";

const queryState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  refetch: vi.fn(),
  data: [
    { code: "dog", name_ko: "강아지", sort_order: 10 },
    { code: "cat", name_ko: "고양이", sort_order: 20 },
    { code: "ferret", name_ko: "페럿", sort_order: 70 },
  ] as unknown[] | undefined,
}));

vi.mock("../api/use-query-species", () => ({
  useQuerySpecies: () => queryState,
}));

beforeEach(() => {
  queryState.isPending = false;
  queryState.isError = false;
  queryState.data = [
    { code: "dog", name_ko: "강아지", sort_order: 10 },
    { code: "cat", name_ko: "고양이", sort_order: 20 },
    { code: "ferret", name_ko: "페럿", sort_order: 70 },
  ];
  queryState.refetch = vi.fn();
});

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

  it("조회가 실패하면 빈 화면 대신 실패 상태와 재시도를 보여준다", async () => {
    // isError 일 때 isPending 은 false 라, 실패 분기가 없으면 스켈레톤도
    // 그리드도 아닌 빈 화면이 된다 — 종을 못 고르면 등록 자체가 막힌다.
    queryState.isError = true;
    queryState.data = undefined;
    render(<SpeciesPicker aria-label="종" onValueChange={vi.fn()} />);

    expect(screen.getByText("종류 목록 불러오기 실패")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(queryState.refetch).toHaveBeenCalledTimes(1);
  });
});

/** 부모가 value 를 쥐는 실제 사용 형태(RHF Controller)를 흉내 낸다. */
function Controlled({ collapsible }: { collapsible?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <SpeciesPicker
      collapsible={collapsible}
      aria-label="종"
      value={value}
      onValueChange={setValue}
    />
  );
}

describe("SpeciesPicker collapsible", () => {
  it("고르면 접히고 선택한 종만 남는다", async () => {
    render(<Controlled collapsible />);

    await userEvent.click(screen.getByRole("radio", { name: "페럿" }));

    expect(
      screen.getByRole("button", { name: /선택한 종류 페럿/ }),
    ).toBeInTheDocument();
  });

  it("접힌 그리드는 inert 라 초점·스크린리더에서 빠진다", async () => {
    // 높이 0 으로 숨기기만 하면 보이지 않는 라디오가 탭 순서에 남는다.
    render(<Controlled collapsible />);

    await userEvent.click(screen.getByRole("radio", { name: "페럿" }));

    const grid = screen.getByRole("radiogroup", { name: "종" });
    expect(grid.closest("[inert]")).not.toBeNull();
  });

  it("접힌 카드를 누르면 다시 펼쳐지고 선택은 유지된다", async () => {
    render(<Controlled collapsible />);
    await userEvent.click(screen.getByRole("radio", { name: "페럿" }));

    await userEvent.click(
      screen.getByRole("button", { name: /선택한 종류 페럿/ }),
    );

    // 두 쪽 모두 DOM 에 남고 inert 로 켜고 끈다(높이 전환을 CSS 로 하기 위해).
    // 접힘/펼침의 판정은 존재 여부가 아니라 inert 다.
    const grid = screen.getByRole("radiogroup", { name: "종" });
    expect(grid.closest("[inert]")).toBeNull();
    expect(
      screen
        .getByRole("button", { name: /선택한 종류 페럿/ })
        .closest("[inert]"),
    ).not.toBeNull();
    expect(screen.getByRole("radio", { name: "페럿" })).toBeChecked();
  });

  it("collapsible 이 아니면 골라도 접히지 않는다 — 지도 필터처럼 결과를 바로 봐야 하는 화면용", async () => {
    render(<Controlled />);

    await userEvent.click(screen.getByRole("radio", { name: "페럿" }));

    expect(
      screen.queryByRole("button", { name: /선택한 종류/ }),
    ).not.toBeInTheDocument();
  });
});
