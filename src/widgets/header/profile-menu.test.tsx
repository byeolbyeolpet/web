// 헤더 프로필 메뉴 — 세 상태(미확정/게스트/로그인)가 다 다르게 생겼다.
//
// 로그아웃이 마이 화면에서 여기로 올라왔으므로, 로그아웃 경로의 검증도
// 여기가 맡는다.

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findA11yViolations } from "@/shared/lib/test/axe";
import { ProfileMenu } from "./profile-menu";

const { signOutMutate, sessionState, profileState } = vi.hoisted(() => ({
  signOutMutate: vi.fn(),
  sessionState: {
    session: { user: { id: "user-1" } } as unknown,
    isLoading: false,
  },
  profileState: {
    isPending: false,
    data: { id: "user-1", nickname: "지호", avatar_url: null } as unknown,
  },
}));

vi.mock("@/features/auth", () => ({
  useSession: () => sessionState,
  useSignOut: () => ({ mutate: signOutMutate, isPending: false }),
}));

vi.mock("@/entities/user", () => ({
  useQueryProfile: () => profileState,
}));

beforeEach(() => {
  vi.clearAllMocks();
  sessionState.session = { user: { id: "user-1" } };
  sessionState.isLoading = false;
  profileState.isPending = false;
  profileState.data = { id: "user-1", nickname: "지호", avatar_url: null };
});

describe("ProfileMenu", () => {
  it("비로그인이면 아바타 대신 로그인 링크를 보여준다", () => {
    sessionState.session = null;
    render(<ProfileMenu />);

    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.queryByRole("button", { name: "계정 메뉴" })).toBeNull();
  });

  it("세션 미확정 구간에는 로그인 링크를 깜빡 보여주지 않는다", () => {
    // 자동 로그인 사용자가 앱을 열 때마다 "로그인" 이 잠깐 보였다 사라지면
    // 로그아웃된 줄 안다.
    sessionState.isLoading = true;
    render(<ProfileMenu />);

    expect(screen.queryByRole("link", { name: "로그인" })).toBeNull();
  });

  it("아바타를 누르면 마이페이지 카드와 로그아웃이 보인다", async () => {
    render(<ProfileMenu />);

    await userEvent.click(screen.getByRole("button", { name: "계정 메뉴" }));

    expect(await screen.findByRole("menu")).toBeInTheDocument();
    // 첫 항목은 라벨이 아니라 목적지다 — 마이페이지로 가는 링크여야 한다.
    const profileCard = screen.getByRole("menuitem", { name: /지호/ });
    expect(profileCard).toHaveAttribute("href", "/me");
    expect(
      screen.getByRole("menuitem", { name: /로그아웃/ }),
    ).toBeInTheDocument();
  });

  it("로그아웃을 누르면 signOut 이 나간다", async () => {
    render(<ProfileMenu />);

    await userEvent.click(screen.getByRole("button", { name: "계정 메뉴" }));
    await userEvent.click(screen.getByRole("menuitem", { name: /로그아웃/ }));

    await waitFor(() => expect(signOutMutate).toHaveBeenCalledTimes(1));
  });

  it("메뉴가 열린 상태에 axe 위반이 없다", async () => {
    render(<ProfileMenu />);

    await userEvent.click(screen.getByRole("button", { name: "계정 메뉴" }));
    await screen.findByRole("menu");

    // 메뉴는 portal 이라 render container 밖에 뜬다 — body 를 검사한다.
    expect(await findA11yViolations(document.body)).toEqual([]);
  });
});
