// 등록 폼 통합 검증 — 필드 오류가 "필드 아래에만" 뜨는지가 핵심이다.
//
// app-message-convention: 필드 메시지를 toast 로 중복 노출하지 않는다.
// 화면 전체에 알려야 하는 것은 제출 실패(서버)뿐이다.

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PetForm } from "./pet-form";

const { mutate, replace, toastSuccess, toastError } = vi.hoisted(() => ({
  mutate: vi.fn(),
  replace: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../api/use-create-pet", () => ({
  useCreatePet: () => ({ mutate, isPending: false }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

vi.mock("@/entities/species/api/use-query-species", () => ({
  useQuerySpecies: () => ({
    isPending: false,
    data: [
      { code: "dog", name_ko: "강아지", sort_order: 10 },
      { code: "ferret", name_ko: "페럿", sort_order: 70 },
    ],
  }),
}));

beforeEach(() => vi.clearAllMocks());

describe("PetForm 검증", () => {
  it("빈 채로 제출하면 필드 아래에 오류를 띄우고 제출하지 않는다", async () => {
    render(<PetForm ownerId="owner-1" />);

    await userEvent.click(screen.getByRole("button", { name: "등록하기" }));

    await waitFor(() =>
      expect(screen.getByText("종류를 선택해 주세요.")).toBeInTheDocument(),
    );
    expect(screen.getByText("이름을 입력해 주세요.")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("필드 오류를 toast 로 중복 노출하지 않는다", async () => {
    render(<PetForm ownerId="owner-1" />);

    await userEvent.click(screen.getByRole("button", { name: "등록하기" }));

    await waitFor(() =>
      expect(screen.getByText("이름을 입력해 주세요.")).toBeInTheDocument(),
    );
    expect(toastError).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("성별은 안 골라도 통과한다 — unknown 이 기본값이다", async () => {
    render(<PetForm ownerId="owner-1" />);

    await userEvent.click(screen.getByRole("radio", { name: "페럿" }));
    await userEvent.type(screen.getByPlaceholderText("코코"), "코코");
    await userEvent.click(screen.getByRole("button", { name: "등록하기" }));

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mutate.mock.calls[0][0]).toEqual({
      name: "코코",
      speciesCode: "ferret",
      sex: "unknown",
    });
  });

  it("이름 앞뒤 공백은 잘라서 보낸다", async () => {
    render(<PetForm ownerId="owner-1" />);

    await userEvent.click(screen.getByRole("radio", { name: "강아지" }));
    await userEvent.type(screen.getByPlaceholderText("코코"), "  초코  ");
    await userEvent.click(screen.getByRole("button", { name: "등록하기" }));

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mutate.mock.calls[0][0].name).toBe("초코");
  });
});

describe("PetForm 접근성", () => {
  it("종 그리드가 radiogroup 이고 legend 로 이름이 붙는다", () => {
    // <label htmlFor> 는 labelable 요소에만 붙어 radiogroup 을 이름 짓지 못한다.
    // fieldset/legend + aria-labelledby 로 묶은 것이 이 테스트의 대상이다.
    render(<PetForm ownerId="owner-1" />);

    expect(
      screen.getByRole("radiogroup", { name: "종류" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radiogroup", { name: "성별" }),
    ).toBeInTheDocument();
  });

  it("오류가 나면 그룹에 aria-invalid 가 붙고 오류가 alert 로 읽힌다", async () => {
    render(<PetForm ownerId="owner-1" />);

    await userEvent.click(screen.getByRole("button", { name: "등록하기" }));

    await waitFor(() =>
      expect(screen.getByRole("radiogroup", { name: "종류" })).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
    expect(screen.getAllByRole("alert").map((el) => el.textContent)).toContain(
      "종류를 선택해 주세요.",
    );
  });

  it("이름 입력이 라벨과 연결된다", () => {
    render(<PetForm ownerId="owner-1" />);

    expect(screen.getByLabelText("이름")).toHaveAttribute(
      "placeholder",
      "코코",
    );
  });
});
