// 등록 경로 통합 검증 — 필드 오류가 "필드 아래에만" 뜨는지가 핵심이다.
//
// app-message-convention: 필드 메시지를 toast 로 중복 노출하지 않는다.
// 화면 전체에 알려야 하는 것은 제출 실패(서버)뿐이다.
//
// PetForm 을 직접 렌더하지 않고 CreatePetForm 을 쓴다 — 폼과 mutation 이
// 실제로 이어지는지(제출값이 그대로 mutate 로 가는지)까지 함께 봐야 한다.

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findA11yViolations } from "@/shared/lib/test/axe";
import { CreatePetForm } from "./create-pet-form";

const { mutate, replace, toastSuccess, toastError } = vi.hoisted(() => ({
  mutate: vi.fn(),
  replace: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

const createPetState = vi.hoisted(() => ({
  isPending: false,
  isSuccess: false,
}));

vi.mock("../api/use-create-pet", () => ({
  useCreatePet: () => ({ ...createPetState, mutate }),
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

beforeEach(() => {
  vi.clearAllMocks();
  createPetState.isPending = false;
  createPetState.isSuccess = false;
});

describe("CreatePetForm 검증", () => {
  it("빈 채로 제출하면 필드 아래에 오류를 띄우고 제출하지 않는다", async () => {
    render(<CreatePetForm ownerId="owner-1" />);

    await userEvent.click(screen.getByRole("button", { name: "등록하기" }));

    await waitFor(() =>
      expect(screen.getByText("종류를 선택해 주세요.")).toBeInTheDocument(),
    );
    expect(screen.getByText("이름을 입력해 주세요.")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("필드 오류를 toast 로 중복 노출하지 않는다", async () => {
    render(<CreatePetForm ownerId="owner-1" />);

    await userEvent.click(screen.getByRole("button", { name: "등록하기" }));

    await waitFor(() =>
      expect(screen.getByText("이름을 입력해 주세요.")).toBeInTheDocument(),
    );
    expect(toastError).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("성별은 안 골라도 통과한다 — unknown 이 기본값이다", async () => {
    render(<CreatePetForm ownerId="owner-1" />);

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

  // 두 번 눌리면 펫이 두 마리 생기고, 지금은 삭제 기능이 없어 되돌릴 수 없다.
  it("제출 중에는 버튼이 잠긴다", () => {
    createPetState.isPending = true;
    render(<CreatePetForm ownerId="owner-1" />);

    expect(screen.getByRole("button", { name: "등록하기" })).toBeDisabled();
  });

  it("성공 후 화면이 넘어가는 동안에도 버튼이 잠긴 채로 있는다", () => {
    // insert 가 끝나면 isPending 은 곧바로 false 지만 router.replace 는
    // 그때부터 화면을 바꾼다 — 그 틈이 중복 제출 구멍이다.
    createPetState.isPending = false;
    createPetState.isSuccess = true;
    render(<CreatePetForm ownerId="owner-1" />);

    expect(screen.getByRole("button", { name: "등록하기" })).toBeDisabled();
  });

  it("이름 앞뒤 공백은 잘라서 보낸다", async () => {
    render(<CreatePetForm ownerId="owner-1" />);

    await userEvent.click(screen.getByRole("radio", { name: "강아지" }));
    await userEvent.type(screen.getByPlaceholderText("코코"), "  초코  ");
    await userEvent.click(screen.getByRole("button", { name: "등록하기" }));

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mutate.mock.calls[0][0].name).toBe("초코");
  });
});

describe("CreatePetForm 접근성", () => {
  it("종 그리드가 radiogroup 이고 legend 로 이름이 붙는다", () => {
    // <label htmlFor> 는 labelable 요소에만 붙어 radiogroup 을 이름 짓지 못한다.
    // fieldset/legend + aria-labelledby 로 묶은 것이 이 테스트의 대상이다.
    render(<CreatePetForm ownerId="owner-1" />);

    expect(
      screen.getByRole("radiogroup", { name: "종류" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radiogroup", { name: "성별" }),
    ).toBeInTheDocument();
  });

  it("오류가 나면 그룹에 aria-invalid 가 붙고 오류가 alert 로 읽힌다", async () => {
    render(<CreatePetForm ownerId="owner-1" />);

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
    render(<CreatePetForm ownerId="owner-1" />);

    expect(screen.getByLabelText("이름")).toHaveAttribute(
      "placeholder",
      "코코",
    );
  });

  // 위의 role 단언은 "내가 의도한 것"만 확인한다. axe 는 의도하지 않은 것을 잡는다
  // — 중복 id, 중첩된 인터랙티브 요소, 라벨 없는 컨트롤, 잘못 쓴 aria 속성.
  // 로그인이 필요한 화면이라 브라우저 axe 가 못 오므로 여기서 대신 본다.
  it("axe 로 검사해도 위반이 없다", async () => {
    const { container } = render(<CreatePetForm ownerId="owner-1" />);

    expect(await findA11yViolations(container)).toEqual([]);
  });

  it("오류가 표시된 상태에서도 axe 위반이 없다", async () => {
    // 오류 표시는 aria-invalid·aria-describedby·role=alert 를 한꺼번에 건드린다.
    // 정상 상태만 검사하면 정작 관계가 꼬이는 상태를 놓친다.
    const { container } = render(<CreatePetForm ownerId="owner-1" />);

    await userEvent.click(screen.getByRole("button", { name: "등록하기" }));
    await waitFor(() =>
      expect(screen.getByText("이름을 입력해 주세요.")).toBeInTheDocument(),
    );

    expect(await findA11yViolations(container)).toEqual([]);
  });
});
