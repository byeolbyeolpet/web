// 로그인 화면 — 버튼 잠금 구간이 핵심이다.
//
// 웹 OAuth 는 window.location.assign 호출 직후 곧바로 resolve 한다. 그래서
// isPending 만 보면 "구글 화면이 뜨기를 기다리는" 구간이 통째로 무방비가 된다.
// 이 파일은 그 구간(=isSuccess)이 잠기는지를 못 박는다.

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginView } from "./index";

const { mutate, replace, signInState, sessionState } = vi.hoisted(() => ({
  mutate: vi.fn(),
  replace: vi.fn(),
  signInState: { isPending: false, isSuccess: false },
  sessionState: { session: null as unknown, isLoading: false },
}));

vi.mock("@/features/auth", () => ({
  useSession: () => sessionState,
  useSignInGoogle: () => ({ ...signInState, mutate }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  signInState.isPending = false;
  signInState.isSuccess = false;
  sessionState.session = null;
  sessionState.isLoading = false;
});

const googleButton = () => screen.getByRole("button", { name: /google/i });

describe("LoginView 로그인 버튼 잠금", () => {
  it("기본 상태에서는 눌린다", () => {
    render(<LoginView />);
    expect(googleButton()).toBeEnabled();
    expect(googleButton()).not.toHaveAttribute("aria-busy");
  });

  it("진행 중(isPending)에는 잠기고 스크린리더에 aria-busy 로 알린다", () => {
    signInState.isPending = true;
    render(<LoginView />);
    expect(googleButton()).toBeDisabled();
    expect(googleButton()).toHaveAttribute("aria-busy", "true");
  });

  // 이 테스트가 이번 수정의 본체다. isPending 만 보던 시절 여기서 통과하지 못했다.
  it("리디렉트 대기 중(isSuccess)에도 잠긴 채로 있는다", () => {
    signInState.isSuccess = true;
    render(<LoginView />);
    expect(googleButton()).toBeDisabled();
  });

  it("실패하면 다시 눌린다 — 재시도를 막지 않는다", () => {
    signInState.isPending = false;
    signInState.isSuccess = false;
    render(<LoginView />);
    expect(googleButton()).toBeEnabled();
  });

  it("세션이 미확정이면 폼을 그리지 않는다", () => {
    sessionState.isLoading = true;
    render(<LoginView />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
