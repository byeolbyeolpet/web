// Button 검증 — loading 잠금·asChild(Slot) 렌더·앵커 클릭 가드.

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button loading", () => {
  it("스피너를 보이고 버튼을 잠그고 aria-busy 를 붙인다", () => {
    render(<Button loading>저장</Button>);

    const button = screen.getByRole("button", { name: "저장" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("문구를 바꾸지 않는다 — 진행 중인지는 스피너가 말한다", () => {
    const { rerender } = render(<Button loading>저장</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("저장");

    rerender(<Button>저장</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("저장");
  });

  it("loading 이 아니면 잠기지도 aria-busy 가 붙지도 않는다", () => {
    render(<Button>저장</Button>);

    const button = screen.getByRole("button", { name: "저장" });
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute("aria-busy");
    expect(button.querySelector("svg")).not.toBeInTheDocument();
  });

  it("loading 이 아니어도 disabled 는 그대로 먹는다", () => {
    render(<Button disabled>저장</Button>);
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });
});

/*
 * Slot 은 자식이 정확히 하나여야 한다. 스피너와 children 을 그냥 나란히 두면
 * loading 이 false 여도 `{false}{children}` 로 배열이 돼 asChild 를 쓰는 모든
 * 버튼이 "Slot failed to slot onto its children" 으로 터진다. 실제로 마이 화면이
 * 이 때문에 열리지 않았다(#34). Slottable 로 막았고 여기서 회귀를 잡는다.
 */
describe("Button asChild", () => {
  it("링크를 감싸도 렌더된다", () => {
    render(
      <Button asChild>
        <a href="/pet/new">반려동물 등록하기</a>
      </Button>,
    );

    expect(
      screen.getByRole("link", { name: "반려동물 등록하기" }),
    ).toHaveAttribute("href", "/pet/new");
  });

  it("loading 과 함께 써도 터지지 않는다", () => {
    render(
      <Button asChild loading>
        <a href="/pet/new">반려동물 등록하기</a>
      </Button>,
    );

    expect(
      screen.getByRole("link", { name: "반려동물 등록하기" }),
    ).toBeInTheDocument();
  });

  it("loading 중 앵커는 aria-disabled 가 붙고 클릭이 막힌다", async () => {
    // 앵커는 disabled 를 모른다 — 로딩 중에도 그대로 이동해 버린다.
    // preventDefault 가드가 클릭(과 키보드 Enter 의 click 이벤트)을 막는다.
    const onClick = vi.fn();
    render(
      <Button asChild loading>
        <a href="/pet/new" onClick={onClick}>
          반려동물 등록하기
        </a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "반려동물 등록하기" });
    expect(link).toHaveAttribute("aria-disabled", "true");

    // pointer-events-none 은 userEvent 클릭 자체를 거부하므로 fireEvent 로
    // "이벤트가 도달했을 때"를 검사한다 — 가드는 preventDefault 로 막는다.
    const event = fireEvent.click(link);
    expect(event).toBe(false); // preventDefault 됨
    expect(onClick).not.toHaveBeenCalled();
  });

  it("loading 이 아니면 앵커 클릭이 막히지 않는다", () => {
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault());
    render(
      <Button asChild>
        <a href="/pet/new" onClick={onClick}>
          반려동물 등록하기
        </a>
      </Button>,
    );

    fireEvent.click(screen.getByRole("link", { name: "반려동물 등록하기" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
