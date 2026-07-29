// 마이 화면 접근성 — 로그인이 필요해 브라우저 axe 가 닿지 못하는 화면이다.
//
// 데이터 훅만 갈아끼우고 UI 는 실물 그대로 렌더한다. UI 까지 스텁으로 바꾸면
// 정작 검사해야 할 DOM 이 사라진다.
//
// 상태마다 DOM 이 완전히 달라지므로(스켈레톤 / 빈 목록 / 목록 있음 / 편집 중)
// 상태별로 나눠 검사한다. 하나만 통과시켜 놓고 "접근성 됐다"고 하면 거짓말이다.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findA11yViolations } from "@/shared/lib/test/axe";
import { MeView } from "./index";

const { sessionState, profileState, petsState } = vi.hoisted(() => ({
  sessionState: {
    session: { user: { id: "user-1" } } as unknown,
    isLoading: false,
  },
  profileState: {
    isPending: false,
    data: { id: "user-1", nickname: "지호", avatar_url: null } as unknown,
  },
  petsState: { isPending: false, data: [] as unknown[] },
}));

vi.mock("@/features/auth/api/use-require-session", () => ({
  useRequireSession: () => sessionState,
}));

vi.mock("@/features/auth/api/use-sign-out", () => ({
  useSignOut: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/entities/user/api/use-query-profile", () => ({
  useQueryProfile: () => profileState,
}));

vi.mock("@/entities/user/api/use-update-nickname", () => ({
  useUpdateNickname: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/entities/pet/api/use-query-pets", () => ({
  useQueryPets: () => petsState,
}));

const PETS = [
  {
    id: "pet-1",
    name: "코코",
    sex: "female",
    species: { code: "ferret", name_ko: "페럿" },
  },
  {
    id: "pet-2",
    name: "초코",
    sex: "unknown",
    species: { code: "dog", name_ko: "강아지" },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  sessionState.session = { user: { id: "user-1" } };
  sessionState.isLoading = false;
  profileState.isPending = false;
  profileState.data = { id: "user-1", nickname: "지호", avatar_url: null };
  petsState.isPending = false;
  petsState.data = [];
});

describe("MeView 접근성", () => {
  it("펫이 없는 상태에 axe 위반이 없다", async () => {
    const { container } = render(<MeView />);

    expect(screen.getByText("아직 등록한 아이가 없어요")).toBeInTheDocument();
    expect(await findA11yViolations(container)).toEqual([]);
  });

  it("펫 목록이 있는 상태에 axe 위반이 없다", async () => {
    petsState.data = PETS;
    const { container } = render(<MeView />);

    expect(screen.getByText("코코")).toBeInTheDocument();
    expect(await findA11yViolations(container)).toEqual([]);
  });

  it("닉네임 편집 중에도 axe 위반이 없다", async () => {
    const { container } = render(<MeView />);

    await userEvent.click(screen.getByRole("button", { name: "닉네임 수정" }));

    expect(screen.getByLabelText("닉네임")).toBeInTheDocument();
    expect(await findA11yViolations(container)).toEqual([]);
  });

  it("로딩 스켈레톤에도 axe 위반이 없다", async () => {
    sessionState.isLoading = true;
    const { container } = render(<MeView />);

    expect(await findA11yViolations(container)).toEqual([]);
  });

  it("아바타 이미지에 대체 텍스트가 있다", () => {
    profileState.data = {
      id: "user-1",
      nickname: "지호",
      avatar_url: "https://example.com/a.png",
    };
    render(<MeView />);

    expect(
      screen.getByRole("img", { name: "프로필 사진" }),
    ).toBeInTheDocument();
  });

  it("아이콘만 있는 버튼에 이름이 붙는다", () => {
    // 연필·+ 는 글자가 없어 aria-label 이 유일한 이름이다. 빠지면 스크린리더에
    // "버튼"으로만 읽힌다.
    petsState.data = PETS;
    render(<MeView />);

    expect(
      screen.getByRole("button", { name: "닉네임 수정" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "반려동물 등록" })).toBeVisible();
  });
});
