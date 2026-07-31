// 펫 등록 mutation 검증 — 핵심은 "0행이 와도 성공으로 넘기지 않는가"다.
//
// PostgREST 는 RLS 로 걸러지면 에러 없이 0행을 준다. 그것을 성공으로 처리하면
// 아무것도 저장되지 않았는데 완료 toast 가 뜨고 목록으로 돌아간다.

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCreatePet } from "./use-create-pet";

const { maybeSingle, insert, toastSuccess, toastError } = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: (values: unknown) => {
        insert(values);
        return { select: () => ({ maybeSingle }) };
      },
    }),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const values = { name: "코코", speciesCode: "ferret", sex: "female" } as const;

beforeEach(() => {
  vi.clearAllMocks();
  // 원본 에러는 console.error 로만 남긴다 — 테스트 출력이 더럽지 않게 가린다.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useCreatePet", () => {
  it("행이 돌아오면 성공으로 처리하고 완료를 알린다", async () => {
    maybeSingle.mockResolvedValue({ data: { id: "pet-1" }, error: null });

    const { result } = renderHook(() => useCreatePet("owner-1"), { wrapper });
    act(() => result.current.mutate(values));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // createDone 은 description 이 없어 두 번째 인자로 undefined 가 실린다.
    // 검증 대상은 제목이므로 첫 인자만 본다.
    expect(toastSuccess.mock.calls[0][0]).toBe("반려동물 등록 완료");
    expect(toastError).not.toHaveBeenCalled();
  });

  it("세션의 owner_id 와 폼 값을 그대로 insert 한다", async () => {
    maybeSingle.mockResolvedValue({ data: { id: "pet-1" }, error: null });

    const { result } = renderHook(() => useCreatePet("owner-1"), { wrapper });
    act(() => result.current.mutate(values));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(insert).toHaveBeenCalledWith({
      owner_id: "owner-1",
      name: "코코",
      species_code: "ferret",
      sex: "female",
    });
  });

  it("에러 없이 0행이면 실패로 본다 (RLS 로 걸러진 경우)", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useCreatePet("owner-1"), { wrapper });
    act(() => result.current.mutate(values));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalled();
  });

  it("Supabase 에러는 사용자에게 원문을 노출하지 않는다", async () => {
    maybeSingle.mockResolvedValue({
      data: null,
      error: {
        code: "23505",
        message: 'duplicate key value violates "pets_pkey"',
      },
    });

    const { result } = renderHook(() => useCreatePet("owner-1"), { wrapper });
    act(() => result.current.mutate(values));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toastError).toHaveBeenCalledWith("반려동물 등록 실패", {
      description: "잠시 후 다시 시도해 주세요.",
    });
  });
});
