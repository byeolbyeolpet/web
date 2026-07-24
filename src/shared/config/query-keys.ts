// TanStack Query Key 중앙 관리 — 호출부에서 키 배열을 직접 조립하지 않는다.
//
// 규칙 (code-convention):
//  - 도메인마다 `all` 을 최상위 루트로 둔다. 그 도메인 전체 무효화는 `all` 로 한다.
//  - 재사용되는 하위 루트는 `{resource}All()` 로 만든다 (예: 모든 list 무효화).
//  - 개별 factory 는 하위 루트를 펼쳐 계층을 맞춘다.
//  - optional 값은 `filter((v) => v !== undefined)` 로 걷어낸다. `filter(Boolean)` 은
//    0·빈문자열 같은 유효한 값까지 지워버린다.
//
// 도메인은 실제 호출부가 생길 때 추가한다. 쓰는 곳 없는 키는 죽은 코드다.

import type { Enums } from "@/shared/lib/supabase/database.types";

export const QUERY_KEYS = {
  species: {
    all: ["species"] as const,
    listAll: () => [...QUERY_KEYS.species.all, "list"] as const,
    list: (group?: Enums<"species_group">) =>
      [...QUERY_KEYS.species.listAll(), group].filter((v) => v !== undefined),
  },
  profile: {
    all: ["profile"] as const,
    detail: (userId?: string) =>
      [...QUERY_KEYS.profile.all, userId].filter((v) => v !== undefined),
  },
} as const;
