// 수정·삭제 경로 검증.
//
// 여기서만 확인되는 것들:
//  - 기존 값이 폼에 실제로 채워지는가 (등록 폼과 공유하는 컴포넌트라 회귀가 쉽다)
//  - 삭제가 확인 없이 바로 나가지 않는가 (되돌릴 수 없는 조작)
//  - 취소하면 정말 아무 일도 없는가

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findA11yViolations } from "@/shared/lib/test/axe";
import { EditPetForm } from "./edit-pet-form";

const { updateMutate, deleteMutate, replace, toastSuccess, toastError } =
  vi.hoisted(() => ({
    updateMutate: vi.fn(),
    deleteMutate: vi.fn(),
    replace: vi.fn(),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
  }));

const updateState = vi.hoisted(() => ({ isPending: false, isSuccess: false }));
const deleteState = vi.hoisted(() => ({ isPending: false, isSuccess: false }));

vi.mock("../api/use-update-pet", () => ({
  useUpdatePet: () => ({ ...updateState, mutate: updateMutate }),
}));

vi.mock("../api/use-delete-pet", () => ({
  useDeletePet: () => ({ ...deleteState, mutate: deleteMutate }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

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

const PET = {
  id: "pet-1",
  name: "코코",
  sex: "female" as const,
  species_code: "ferret",
  owner_id: "owner-1",
};

beforeEach(() => {
  vi.clearAllMocks();
  updateState.isPending = false;
  updateState.isSuccess = false;
  deleteState.isPending = false;
  deleteState.isSuccess = false;
});

describe("EditPetForm 수정", () => {
  it("기존 값이 폼에 채워진다", () => {
    render(<EditPetForm pet={PET} />);

    expect(screen.getByLabelText("이름")).toHaveValue("코코");
    expect(screen.getByRole("radio", { name: "페럿" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "암컷" })).toBeChecked();
  });

  it("바꾼 값만 반영해 저장한다", async () => {
    render(<EditPetForm pet={PET} />);

    const name = screen.getByLabelText("이름");
    await userEvent.clear(name);
    await userEvent.type(name, "초코");
    await userEvent.click(screen.getByRole("button", { name: "저장하기" }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalled());
    expect(updateMutate.mock.calls[0][0]).toEqual({
      name: "초코",
      speciesCode: "ferret",
      sex: "female",
    });
  });

  it("이름을 비우면 저장하지 않는다", async () => {
    render(<EditPetForm pet={PET} />);

    await userEvent.clear(screen.getByLabelText("이름"));
    await userEvent.click(screen.getByRole("button", { name: "저장하기" }));

    await waitFor(() =>
      expect(screen.getByText("이름을 입력해 주세요.")).toBeInTheDocument(),
    );
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("저장 후 화면이 넘어가는 동안에도 버튼이 잠긴다", () => {
    updateState.isSuccess = true;
    render(<EditPetForm pet={PET} />);

    expect(screen.getByRole("button", { name: "저장하기" })).toBeDisabled();
  });

  it("삭제가 진행되는 동안에는 저장 버튼도 잠긴다", () => {
    // 지워지는 행에 update 가 나가면 안 된다 — 두 mutation 이 서로를 잠근다.
    deleteState.isPending = true;
    render(<EditPetForm pet={PET} />);

    expect(screen.getByRole("button", { name: "저장하기" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /삭제하기/ })).toBeDisabled();
  });
});

describe("EditPetForm 삭제", () => {
  it("삭제 버튼을 눌러도 바로 지우지 않고 확인을 먼저 띄운다", async () => {
    render(<EditPetForm pet={PET} />);

    await userEvent.click(screen.getByRole("button", { name: /삭제하기/ }));

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(deleteMutate).not.toHaveBeenCalled();
  });

  it("확인해야 삭제가 나간다", async () => {
    render(<EditPetForm pet={PET} />);

    await userEvent.click(screen.getByRole("button", { name: /삭제하기/ }));
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "삭제" }));

    expect(deleteMutate).toHaveBeenCalledTimes(1);
  });

  it("취소하면 아무 일도 일어나지 않는다", async () => {
    render(<EditPetForm pet={PET} />);

    await userEvent.click(screen.getByRole("button", { name: /삭제하기/ }));
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "취소" }));

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(deleteMutate).not.toHaveBeenCalled();
  });

  it("확인창에 axe 위반이 없다", async () => {
    render(<EditPetForm pet={PET} />);

    await userEvent.click(screen.getByRole("button", { name: /삭제하기/ }));
    await screen.findByRole("alertdialog");

    // 다이얼로그는 portal 이라 render container 밖에 뜬다 — body 를 검사한다.
    expect(await findA11yViolations(document.body)).toEqual([]);
  });
});
