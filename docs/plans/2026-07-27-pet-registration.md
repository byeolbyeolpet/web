# 펫 등록 구현 계획

> **에이전트 작업자에게:** 이 계획은 task 단위로 실행한다. 각 단계는 체크박스(`- [ ]`)로 추적한다.

**목표:** 로그인한 사용자가 반려동물(이름·종·성별)을 등록하고 마이 탭에서 목록으로 확인한다.

**아키텍처:** FSD. 종 선택 그리드는 `entities/species`(여러 feature 가 공유), 등록 행위는 `features/register-pet`, 목록 조회·카드는 `entities/pet`. 화면은 `(full)` 라우트 그룹(뒤로가기 중심). mutation 은 클라이언트 Supabase client 로 한다 — Static Export 라 서버 런타임이 없다.

**기술 스택:** Next 16 (Static Export) · React 19 · TanStack Query · react-hook-form + zod v4 · Radix (`radix-ui` 통합 패키지) · Tailwind v4 · Supabase (PostgREST + RLS) · Vitest + Testing Library

**설계 근거:** [docs/specs/2026-07-27-pet-registration-design.md](../specs/2026-07-27-pet-registration-design.md)

---

## 파일 구조

| 파일 | 책임 |
|---|---|
| `supabase/migrations/<ts>_pets_name_length_check.sql` | 이름 길이 DB 제약 |
| `src/shared/config/form-message.ts` | **신규** 필드 검증 문구 |
| `src/shared/config/app-message.ts` | `pet` 도메인 추가 |
| `src/shared/config/query-keys.ts` | `pet` 키 팩토리 추가 |
| `src/shared/ui/radio-cards.tsx` | **신규** 카드형 단일선택 원시 |
| `src/shared/ui/form.tsx` | **신규** shadcn RHF 바인딩 |
| `src/entities/species/ui/species-picker.tsx` | **신규** 14종 그리드 |
| `src/entities/pet/api/use-query-pets.ts` | **신규** 내 펫 목록 |
| `src/entities/pet/ui/pet-card.tsx` | **신규** 펫 카드 |
| `src/features/register-pet/model/schema.ts` | **신규** zod 스키마 |
| `src/features/register-pet/api/use-create-pet.ts` | **신규** insert mutation |
| `src/features/register-pet/ui/pet-form.tsx` | **신규** 폼 조립 |
| `src/views/pet-new/index.tsx` | **신규** 화면(가드 + 폼) |
| `src/app/(full)/pet/new/page.tsx` | **신규** 라우팅 껍데기 |
| `src/views/me/index.tsx` | 펫 목록 섹션 추가 |

---

## Task 1: DB 이름 길이 제약

**Files:**
- Create: `supabase/migrations/20260727HHMMSS_pets_name_length_check.sql`
- Modify: `src/shared/lib/supabase/database.types.ts` (자동 생성)

- [ ] **Step 1: 마이그레이션 파일 작성**

파일명의 `HHMMSS` 는 작성 시각으로 채운다(기존 파일들과 같은 형식).

```sql
-- 펫 이름 길이 제약. RLS 는 "본인 행인가"만 보고 길이는 통과시킨다.
-- 클라이언트 zod(1~20자)와 같은 범위를 DB 에도 걸어 직접 호출 경로를 막는다.
alter table public.pets
  add constraint pets_name_length_check
  check (char_length(btrim(name)) between 1 and 20);
```

- [ ] **Step 2: 원격에 적용**

Supabase MCP `apply_migration` 으로 위 SQL 을 적용한다(name: `pets_name_length_check`).

- [ ] **Step 3: 제약이 실제로 걸렸는지 확인**

MCP `execute_sql`:

```sql
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.pets'::regclass and conname = 'pets_name_length_check';
```

기대: 1행, `CHECK ((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 20))`

- [ ] **Step 4: 타입 재생성**

MCP `generate_typescript_types` 결과를 `src/shared/lib/supabase/database.types.ts` 에 덮어쓴다. (이 저장소에는 `db:types` npm 스크립트가 없다.)

- [ ] **Step 5: 타입체크**

Run: `npm run typecheck`
기대: 통과 (check 제약은 타입에 영향 없음 — 변경 없음이 정상)

- [ ] **Step 6: 커밋**

```bash
git add supabase/migrations src/shared/lib/supabase/database.types.ts
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#34): 펫 이름 길이 DB check 제약 추가/Claude"
```

---

## Task 2: 문구·쿼리키 상수

**Files:**
- Create: `src/shared/config/form-message.ts`
- Modify: `src/shared/config/app-message.ts`
- Modify: `src/shared/config/query-keys.ts`

- [ ] **Step 1: `form-message.ts` 생성**

```ts
// 폼 필드 검증 문구 중앙 관리 — Zod·RHF FieldError 로 필드 아래에 표시한다.
// 필드 메시지는 toast 로 중복 노출하지 않는다 (app-message-convention).
// 사용자가 입력을 고칠 수 있게 문장형으로 쓴다.

export const FORM_MESSAGE = {
  pet: {
    nameRequired: "반려동물 이름을 입력해 주세요.",
    nameTooLong: "이름은 20자까지 입력할 수 있어요.",
    speciesRequired: "종을 선택해 주세요.",
  },
} as const;
```

- [ ] **Step 2: `app-message.ts` 에 `pet` 추가**

`profile` 블록 뒤, 닫는 `} as const;` 앞에 넣는다.

```ts
  pet: {
    createDone: { title: "펫 등록 완료" },
    createFailed: {
      title: "펫 등록 실패",
      description: "잠시 후 다시 시도해 주세요.",
    },
    loadFailed: {
      title: "펫 목록 불러오기 실패",
      description: "목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  },
```

- [ ] **Step 3: `query-keys.ts` 에 `pet` 추가**

`profile` 블록 뒤에 넣는다.

```ts
  pet: {
    all: ["pet"] as const,
    listAll: () => [...QUERY_KEYS.pet.all, "list"] as const,
    listByOwner: (ownerId?: string) =>
      [...QUERY_KEYS.pet.listAll(), ownerId].filter((v) => v !== undefined),
  },
```

- [ ] **Step 4: 타입체크·포맷**

Run: `npm run typecheck && npm run format:check`
기대: 둘 다 통과

- [ ] **Step 5: 커밋**

```bash
git add src/shared/config
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#34): FORM_MESSAGE 신설 + APP_MESSAGE·QUERY_KEYS 에 pet 추가/Claude"
```

---

## Task 3: `RadioCards` 원시

카드형 단일 선택. 종 그리드(14개)와 성별 세그먼트(3개)가 **같은 원시를 공유**하고 레이아웃만 다르게 쓴다.

**Files:**
- Create: `src/shared/ui/radio-cards.tsx`
- Test: `src/shared/ui/radio-cards.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RadioCard, RadioCards } from "./radio-cards";

describe("RadioCards", () => {
  it("radiogroup 과 radio 시맨틱으로 렌더된다", () => {
    render(
      <RadioCards aria-label="종">
        <RadioCard value="dog">강아지</RadioCard>
        <RadioCard value="cat">고양이</RadioCard>
      </RadioCards>,
    );

    expect(screen.getByRole("radiogroup", { name: "종" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("선택하면 onValueChange 로 값을 올려보낸다", async () => {
    const onValueChange = vi.fn();
    render(
      <RadioCards aria-label="종" onValueChange={onValueChange}>
        <RadioCard value="dog">강아지</RadioCard>
        <RadioCard value="cat">고양이</RadioCard>
      </RadioCards>,
    );

    await userEvent.click(screen.getByRole("radio", { name: "고양이" }));

    expect(onValueChange).toHaveBeenCalledWith("cat");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm run test -- src/shared/ui/radio-cards.test.tsx`
기대: FAIL — `Failed to resolve import "./radio-cards"`

- [ ] **Step 3: 구현**

```tsx
"use client";
// 카드형 단일 선택 원시 — 종 선택 그리드와 성별 세그먼트가 공유한다.
// 버튼 배열로 만들면 "N개 중 하나"라는 관계를 스크린리더가 읽지 못한다.
// 레이아웃(그리드/세그먼트)은 호출부가 className 으로 정한다.

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { cn } from "@/shared/lib/utils";

function RadioCards({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-cards"
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}

function RadioCard({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-card"
      className={cn(
        // 최소 탭 영역 44px (CLAUDE.md UX 규칙)
        "flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-2 text-sm font-medium transition-colors outline-none select-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        // 선택 상태는 종 태그와 같은 tint 계열로 — 브랜드 색을 한 단계 올린다(design-convention)
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary-tint data-[state=checked]:text-primary-tint-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { RadioCards, RadioCard };
```

- [ ] **Step 4: 통과 확인**

Run: `npm run test -- src/shared/ui/radio-cards.test.tsx`
기대: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/shared/ui/radio-cards.tsx src/shared/ui/radio-cards.test.tsx
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#34): 카드형 단일선택 원시 RadioCards 추가/Claude"
```

---

## Task 4: shadcn `form` 추가

**Files:**
- Create: `src/shared/ui/form.tsx` (shadcn CLI 생성)

- [ ] **Step 1: shadcn CLI 로 추가**

```bash
npx shadcn@latest add form
```

`src/shared/ui/form.tsx` 가 생성된다(`components.json` 의 alias 가 `@/shared/ui`).

- [ ] **Step 2: 파일 헤더 주석 추가**

생성된 파일 맨 위 `"use client";` 바로 아래에 넣는다(AGENTS.md 파일 헤더 규칙).

```tsx
// shadcn Form — react-hook-form 바인딩. label·control·error 의 aria 연결을 담당한다.
```

- [ ] **Step 3: 44px 스케일 위반이 없는지 확인**

Run: `grep -n "h-8\|h-9\|h-10\|size-8\|size-9\|size-10" src/shared/ui/form.tsx`
기대: 출력 없음. 출력이 있으면 `button.tsx` 와 같은 방식으로 44px 이상으로 올리고, 무엇을 왜 고쳤는지 `docs/conventions/design-convention.md` 의 6-1 "원본에서 손댄 것" 표에 한 줄 추가한다.

- [ ] **Step 4: 타입체크·린트·포맷**

Run: `npm run typecheck && npm run lint && npm run format:check`
기대: 전부 통과. 포맷이 깨졌으면 `npx prettier --write src/shared/ui/form.tsx`

- [ ] **Step 5: 커밋**

```bash
git add src/shared/ui/form.tsx docs/conventions/design-convention.md
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#34): shadcn Form 추가 — RHF 바인딩/Claude"
```

---

## Task 5: 종 선택 그리드

**Files:**
- Create: `src/entities/species/ui/species-picker.tsx`
- Modify: `src/entities/species/index.ts`
- Test: `src/entities/species/ui/species-picker.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`useQuerySpecies` 를 목킹해 네트워크 없이 렌더만 검증한다.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SpeciesPicker } from "./species-picker";

vi.mock("../api/use-query-species", () => ({
  useQuerySpecies: () => ({
    isPending: false,
    data: [
      { code: "dog", name_ko: "강아지", sort_order: 10 },
      { code: "cat", name_ko: "고양이", sort_order: 20 },
      { code: "ferret", name_ko: "페럿", sort_order: 70 },
    ],
  }),
}));

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
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm run test -- src/entities/species/ui/species-picker.test.tsx`
기대: FAIL — `Failed to resolve import "./species-picker"`

- [ ] **Step 3: 구현**

```tsx
"use client";
// 종 선택 그리드 — species 를 sort_order 순서 그대로 편다.
// 종이 늘어도 이 파일은 고치지 않는다: 순서도 그룹도 DB 가 갖는다(ADR-0005).
// 펫 등록 전용이 아니다 — 지도 필터·후기 방문종·커뮤니티 종 태그가 같은 UI 를 쓴다.

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { RadioCard, RadioCards } from "@/shared/ui/radio-cards";
import { Skeleton } from "@/shared/ui/skeleton";
import { useQuerySpecies } from "../api/use-query-species";

export function SpeciesPicker({
  className,
  ...props
}: React.ComponentProps<typeof RadioCards>) {
  const { data, isPending } = useQuerySpecies();

  if (isPending) {
    return (
      <div className="grid grid-cols-3 gap-2" aria-hidden>
        {Array.from({ length: 14 }, (_, i) => (
          <Skeleton key={i} className="h-11 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <RadioCards className={cn("grid-cols-3", className)} {...props}>
      {data?.map((species) => (
        <RadioCard key={species.code} value={species.code}>
          {species.name_ko}
        </RadioCard>
      ))}
    </RadioCards>
  );
}
```

- [ ] **Step 4: 공개 API 노출**

`src/entities/species/index.ts` 에 한 줄 추가한다.

```ts
export { SpeciesPicker } from "./ui/species-picker";
```

- [ ] **Step 5: 통과 확인**

Run: `npm run test -- src/entities/species/ui/species-picker.test.tsx`
기대: PASS (2 tests)

- [ ] **Step 6: 커밋**

```bash
git add src/entities/species
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#34): 종 선택 그리드 SpeciesPicker — sort_order 순서 그대로/Claude"
```

---

## Task 6: zod 스키마

**Files:**
- Create: `src/features/register-pet/model/schema.ts`
- Test: `src/features/register-pet/model/schema.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`.trim()` 이 검증 **전에** 적용되는지가 핵심이다(zod v4 동작 확인 겸).

```ts
import { describe, expect, it } from "vitest";
import { FORM_MESSAGE } from "@/shared/config/form-message";
import { petFormSchema } from "./schema";

const valid = { name: "코코", speciesCode: "ferret", sex: "female" };

describe("petFormSchema", () => {
  it("유효한 입력을 통과시킨다", () => {
    expect(petFormSchema.safeParse(valid).success).toBe(true);
  });

  it("이름 앞뒤 공백을 잘라낸다", () => {
    const result = petFormSchema.safeParse({ ...valid, name: "  코코  " });
    expect(result.success && result.data.name).toBe("코코");
  });

  it("공백뿐인 이름을 거부한다", () => {
    const result = petFormSchema.safeParse({ ...valid, name: "   " });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0].message).toBe(
      FORM_MESSAGE.pet.nameRequired,
    );
  });

  it("21자 이름을 거부한다", () => {
    const result = petFormSchema.safeParse({ ...valid, name: "가".repeat(21) });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0].message).toBe(
      FORM_MESSAGE.pet.nameTooLong,
    );
  });

  it("20자 이름은 통과시킨다 (DB 제약과 같은 경계)", () => {
    const result = petFormSchema.safeParse({ ...valid, name: "가".repeat(20) });
    expect(result.success).toBe(true);
  });

  it("종 미선택을 거부한다", () => {
    const result = petFormSchema.safeParse({ ...valid, speciesCode: "" });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0].message).toBe(
      FORM_MESSAGE.pet.speciesRequired,
    );
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm run test -- src/features/register-pet/model/schema.test.ts`
기대: FAIL — `Failed to resolve import "./schema"`

- [ ] **Step 3: 구현**

```ts
// 펫 등록 폼 검증 — DB 제약(pets_name_length_check)과 같은 범위를 클라이언트에서 먼저 막는다.
// 문구는 FORM_MESSAGE 에서 가져온다(app-message-convention).

import { z } from "zod";
import { FORM_MESSAGE } from "@/shared/config/form-message";

export const petFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, FORM_MESSAGE.pet.nameRequired)
    .max(20, FORM_MESSAGE.pet.nameTooLong),
  // 유효한 코드인지는 DB FK 가 본다. 여기서는 "골랐는가"만 본다.
  speciesCode: z.string().min(1, FORM_MESSAGE.pet.speciesRequired),
  sex: z.enum(["male", "female", "unknown"]),
});

export type PetFormValues = z.infer<typeof petFormSchema>;
```

- [ ] **Step 4: 통과 확인**

Run: `npm run test -- src/features/register-pet/model/schema.test.ts`
기대: PASS (6 tests)

**"이름 앞뒤 공백을 잘라낸다" 가 실패하면** zod v4 에서 `.trim()` 이 후속 검증 전에 적용되지 않는 것이다. 그때는 `z.string().transform((v) => v.trim()).pipe(z.string().min(1, ...).max(20, ...))` 로 바꾸고 테스트를 다시 돌린다. 테스트는 그대로 둔다 — 기대 동작이 바뀌는 게 아니라 표현만 바뀐다.

- [ ] **Step 5: 커밋**

```bash
git add src/features/register-pet/model
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#34): 펫 등록 zod 스키마 — DB 제약과 같은 경계/Claude"
```

---

## Task 7: 등록 mutation

**Files:**
- Create: `src/features/register-pet/api/use-create-pet.ts`

- [ ] **Step 1: 구현**

`use-update-nickname.ts` 의 패턴(에러는 `console.error` 로만, 사용자에겐 `APP_MESSAGE`)을 따른다.

```ts
// 펫 등록 — owner_id 는 세션에서 받는다. RLS 가 auth.uid() = owner_id 를 강제한다.
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createClient } from "@/shared/lib/supabase/client";
import type { PetFormValues } from "../model/schema";

export function useCreatePet(ownerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: PetFormValues) => {
      const { data, error } = await createClient()
        .from("pets")
        .insert({
          owner_id: ownerId,
          name: values.name,
          species_code: values.speciesCode,
          sex: values.sex,
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      // RLS 로 걸러지면 에러 없이 0행이 된다 — 행이 안 돌아오면 실패로 간주한다.
      if (!data) throw new Error("pet insert: no row returned");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pet.all });
      toast.success(APP_MESSAGE.pet.createDone.title);
    },
    onError: (error) => {
      console.error(error);
      toast.error(APP_MESSAGE.pet.createFailed.title, {
        description: APP_MESSAGE.pet.createFailed.description,
      });
    },
  });
}
```

- [ ] **Step 2: 타입체크**

Run: `npm run typecheck`
기대: 통과. `insert` 인자 타입이 안 맞으면 `database.types.ts` 의 `pets` `Insert` 타입을 열어 실제 필드명을 확인하고 맞춘다(추측하지 않는다).

- [ ] **Step 3: 커밋**

```bash
git add src/features/register-pet/api
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#34): 펫 등록 mutation — 0행 반영을 실패로 처리/Claude"
```

---

## Task 8: 등록 폼

**Files:**
- Create: `src/features/register-pet/ui/pet-form.tsx`
- Create: `src/features/register-pet/index.ts`

- [ ] **Step 1: 폼 구현**

```tsx
"use client";
// 펫 등록 폼 — 이름·종·성별 3필드. 필드 오류는 필드 아래에만 표시하고
// 제출 실패(서버)만 toast 로 알린다(app-message-convention).

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { SpeciesPicker } from "@/entities/species";
import { Button } from "@/shared/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { RadioCard, RadioCards } from "@/shared/ui/radio-cards";
import { useCreatePet } from "../api/use-create-pet";
import { petFormSchema, type PetFormValues } from "../model/schema";

const SEX_OPTIONS = [
  { value: "female", label: "여아" },
  { value: "male", label: "남아" },
  { value: "unknown", label: "모름" },
] as const;

export function PetForm({ ownerId }: { ownerId: string }) {
  const router = useRouter();
  const createPet = useCreatePet(ownerId);

  const form = useForm<PetFormValues>({
    resolver: zodResolver(petFormSchema),
    defaultValues: { name: "", speciesCode: "", sex: "unknown" },
  });

  const onSubmit = (values: PetFormValues) =>
    createPet.mutate(values, { onSuccess: () => router.replace("/me") });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-6 p-4 pb-safe-bottom"
      >
        <FormField
          control={form.control}
          name="speciesCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>어떤 아이인가요?</FormLabel>
              <FormControl>
                <SpeciesPicker
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름</FormLabel>
              <FormControl>
                <Input placeholder="코코" maxLength={20} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>성별</FormLabel>
              <FormControl>
                <RadioCards
                  className="grid-cols-3"
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  {SEX_OPTIONS.map((option) => (
                    <RadioCard key={option.value} value={option.value}>
                      {option.label}
                    </RadioCard>
                  ))}
                </RadioCards>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="mt-auto"
          disabled={createPet.isPending}
        >
          {createPet.isPending ? "등록 중…" : "등록하기"}
        </Button>
      </form>
    </Form>
  );
}
```

- [ ] **Step 2: 공개 API**

```ts
// register-pet 슬라이스 공개 API — 바깥에서는 이 파일이 노출한 것만 import 한다.
export { PetForm } from "./ui/pet-form";
```

- [ ] **Step 3: 타입체크·린트**

Run: `npm run typecheck && npm run lint`
기대: 통과

- [ ] **Step 4: 커밋**

```bash
git add src/features/register-pet
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#34): 펫 등록 폼 — RHF+zod, 종 그리드·성별 세그먼트/Claude"
```

---

## Task 9: 화면과 라우트 — 여기서 UI 가 처음 뜬다

**Files:**
- Create: `src/views/pet-new/index.tsx`
- Create: `src/app/(full)/pet/new/page.tsx`

- [ ] **Step 1: 화면 조립**

`views/me/index.tsx` 의 가드 패턴을 따른다.

```tsx
// 펫 등록 화면 — 로그인 필수 (클라 가드, ADR-0004).
"use client";

import { useRequireSession } from "@/features/auth";
import { PetForm } from "@/features/register-pet";
import { Skeleton } from "@/shared/ui/skeleton";

export function PetNewView() {
  const { session, isLoading } = useRequireSession();

  // 세션 미확정이거나 리다이렉트 직전 — 빈 화면 대신 스켈레톤.
  if (isLoading || !session) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return <PetForm ownerId={session.user.id} />;
}
```

- [ ] **Step 2: 라우팅 껍데기**

```tsx
// 펫 등록 라우트 (/pet/new) — views/pet-new 위임.
import { PetNewView } from "@/views/pet-new";

export default function Page() {
  return <PetNewView />;
}
```

- [ ] **Step 3: 빌드**

Run: `npm run build`
기대: 통과, 출력에 `/pet/new` 가 정적 경로로 나온다

- [ ] **Step 4: 브라우저에서 확인**

`preview_start` 로 dev 서버를 띄우고 `/login` 에서 로그인한 뒤 `/pet/new` 로 이동한다. 확인 항목:

1. 종 14개가 3열 그리드로, 강아지·고양이가 맨 앞 두 칸
2. 종을 탭하면 보라 tint 로 채워지고 이전 선택이 풀린다
3. 이름 비우고 제출 → 필드 아래에 "반려동물 이름을 입력해 주세요." (toast 아님)
4. 종 미선택 제출 → 필드 아래에 "종을 선택해 주세요."
5. 라이트/다크 양쪽에서 선택 상태가 구분된다
6. `read_console_messages` 에 에러 없음

- [ ] **Step 5: 지호님 문구 검토 (중단점)**

스크린샷을 지호님께 보여주고 **화면 문구를 확인받는다.** 검토 대상:

- 필드 라벨: "어떤 아이인가요?" · "이름" · "성별"
- 성별 선택지: "여아" · "남아" · "모름"
- 버튼: "등록하기" / "등록 중…"
- 입력 placeholder: "코코"
- `FORM_MESSAGE.pet` 3개 문구
- `APP_MESSAGE.pet` 문구

**수정 요청을 받으면 반영하고 다시 보여준 뒤에** 다음 단계로 간다.

- [ ] **Step 6: 커밋**

```bash
git add src/views/pet-new "src/app/(full)/pet"
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#34): 펫 등록 화면·라우트 (/pet/new)/Claude"
```

---

## Task 10: 펫 목록 조회와 카드

**Files:**
- Create: `src/entities/pet/api/use-query-pets.ts`
- Create: `src/entities/pet/ui/pet-card.tsx`
- Create: `src/entities/pet/index.ts`

- [ ] **Step 1: 조회 훅 구현**

```ts
// 내 펫 목록 — 소유자 기준. pets 는 읽기 공개지만 이 목록은 본인 것만 본다.
"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createClient } from "@/shared/lib/supabase/client";

export function useQueryPets(ownerId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.pet.listByOwner(ownerId),
    enabled: Boolean(ownerId),
    queryFn: async () => {
      // 종 이름은 조인해서 한 번에 받는다 — 목록마다 종을 다시 조회하지 않는다.
      const { data, error } = await createClient()
        .from("pets")
        .select("id, name, sex, species (code, name_ko)")
        .eq("owner_id", ownerId!)
        .order("created_at", { ascending: false });
      if (error) {
        console.error(error);
        throw error;
      }
      return data;
    },
  });
}

export type PetListItem = NonNullable<
  ReturnType<typeof useQueryPets>["data"]
>[number];
```

- [ ] **Step 2: 타입체크로 조인 형태 확인**

Run: `npm run typecheck`

`species` 임베드가 배열로 추론되거나 이름을 못 찾으면, 관계 힌트를 붙인 `species:species_code (code, name_ko)` 로 바꾸고 다시 돌린다. **`as unknown as` 이중 단언으로 덮지 않는다**(AGENTS.md Supabase 규율). 추론된 타입에 코드를 맞춘다.

- [ ] **Step 3: 카드 구현**

```tsx
// 펫 카드 — 목록 한 줄. 종은 tint 배지로 올린다(해자 가시성, design-convention).
import { Badge } from "@/shared/ui/badge";
import type { PetListItem } from "../api/use-query-pets";

const SEX_LABEL = {
  female: "여아",
  male: "남아",
  unknown: "성별 모름",
} as const;

export function PetCard({ pet }: { pet: PetListItem }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-medium">{pet.name}</span>
        <span className="text-xs text-muted-foreground">
          {SEX_LABEL[pet.sex]}
        </span>
      </div>
      {pet.species && (
        <Badge variant="tint" className="ml-auto">
          {pet.species.name_ko}
        </Badge>
      )}
    </li>
  );
}
```

Step 2 에서 `species` 가 non-nullable 로 추론되면 `pet.species &&` 조건을 지운다 — nullable 이 아닌 값에 불필요한 fallback 을 두지 않는다(AGENTS.md).

- [ ] **Step 4: 공개 API**

```ts
// pet 슬라이스 공개 API — 바깥에서는 이 파일이 노출한 것만 import 한다.
export { useQueryPets, type PetListItem } from "./api/use-query-pets";
export { PetCard } from "./ui/pet-card";
```

- [ ] **Step 5: 타입체크·린트**

Run: `npm run typecheck && npm run lint`
기대: 통과

- [ ] **Step 6: 커밋**

```bash
git add src/entities/pet
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#34): 펫 목록 조회 훅과 카드/Claude"
```

---

## Task 11: 마이 탭에 목록 붙이기

**Files:**
- Modify: `src/views/me/index.tsx`

- [ ] **Step 1: import 추가**

```tsx
import Link from "next/link";
import { PetCard, useQueryPets } from "@/entities/pet";
```

- [ ] **Step 2: 훅 호출 추가**

`const signOut = useSignOut();` 아래에 넣는다.

```tsx
  const pets = useQueryPets(session?.user.id);
```

**주의:** `useQueryPets` 는 조기 return(`isLoading || !session`) **위**에 있어야 한다. 훅은 조건부로 호출할 수 없다.

- [ ] **Step 3: 목록 섹션 렌더**

닉네임 블록과 로그아웃 버튼 사이에 넣는다.

```tsx
      <section className="flex w-full max-w-80 flex-col gap-3">
        <h2 className="font-heading text-base font-bold">나의 반려동물</h2>

        {pets.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : pets.data?.length ? (
          <ul className="flex flex-col gap-2">
            {pets.data.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            아직 등록한 반려동물이 없어요.
          </p>
        )}

        <Button variant="outline" asChild>
          <Link href="/pet/new">반려동물 등록</Link>
        </Button>
      </section>
```

빈 상태를 `ScreenPlaceholder` 로 대신하지 않는다 — 그건 "준비 중" 문구가 박힌 스캐폴딩 컴포넌트다.

- [ ] **Step 4: 빌드**

Run: `npm run build`
기대: 통과

- [ ] **Step 5: 브라우저에서 흐름 확인**

`/me` → "반려동물 등록" → 등록 → `/me` 로 복귀 → 목록에 카드가 보인다. 확인 항목:

1. 등록 직후 목록이 자동 갱신된다(invalidate 동작)
2. 종 배지가 tint 색으로 보인다
3. 펫이 없을 때 "아직 등록한 반려동물이 없어요."
4. `read_console_messages` 에 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add src/views/me
git commit --author="Claude <noreply@anthropic.com>" -m "feat(#34): 마이 탭에 펫 목록·등록 진입 추가/Claude"
```

---

## Task 12: 전체 검증과 에뮬레이터 실측

- [ ] **Step 1: 검증 순서대로 실행**

`validation-convention` 4절 순서다.

```bash
npm run typecheck && npm run format:check && npm run lint && npm run build && npm run test
```

기대: 전부 통과. 실패하면 원인을 `권한`·`네트워크`·`코드 오류`·`포맷 오류`·`환경 문제` 중 하나로 분류하고 같은 명령을 같은 권한으로 반복하지 않는다.

- [ ] **Step 2: 안드로이드 에뮬레이터 실측**

```bash
npm run app:android
```

Android Studio 에서 실행 후 확인:

1. 로그인 → 마이 탭 → 반려동물 등록
2. 종 그리드가 좁은 화면에서도 3열로 깨지지 않는다
3. 이름 입력 시 키보드가 올라와도 등록 버튼에 닿는다
4. 등록 → 마이 탭 복귀 → 카드 노출
5. 앱을 강제 종료 후 재실행해도 목록이 유지된다
6. 특수동물(예: 페럿)로 한 마리 더 등록해 tint 배지 확인

- [ ] **Step 3: 이슈 완료 조건 갱신**

[#34](https://github.com/byeolbyeolpet/web/issues/34) 의 체크박스를 실제 결과로 채운다. 범위에서 뺀 것(사진·품종·생일·중성화·체중·수정/삭제)은 후속 이슈로 만들고 #34 에 링크한다.

- [ ] **Step 4: 후속 이슈 생성**

- 펫 사진 업로드 (Supabase Storage 신규 — 후기 영수증 인증과 기반 공유)
- 펫 수정·삭제
- 품종 입력 (+ ADR-0005 에 "품종은 필터·검색 소비처가 생길 때 정규화" 갱신)
- 펫 상세 필드(생일·중성화·체중)

---

## 자체 점검 결과

**스펙 커버리지**

| 스펙 항목 | Task |
|---|---|
| 범위 3필드 + 목록 | 8, 10, 11 |
| 14종 균등 그리드 | 5 |
| 그리드를 entities/species 에 | 5 |
| RHF + zod | 4, 6, 8 |
| RadioGroup 원시 공유 | 3 (종·성별 둘 다 사용) |
| zod + DB check 이중 검증 | 1, 6 |
| 구조(슬라이스 배치) | 파일 구조 표 |
| 데이터 흐름·invalidate | 7, 10, 11 |
| `APP_MESSAGE.pet` · `FORM_MESSAGE` | 2 |
| 빈 상태를 직접 구현 | 11 |
| `(full)` 라우트 + 세션 가드 | 9 |

**미해결로 남긴 것**

- `docs/conventions/app-message-convention.md` 는 `APP_MESSAGE_CODE` 도 규정하지만 `app-message.ts` 에 구현돼 있지 않고 기존 호출부(auth·profile)도 쓰지 않는다. 이 계획은 **기존 코드의 실제 관행을 따라** `APP_MESSAGE` 만 쓴다. 컨벤션과 코드 중 어느 쪽을 고칠지는 별건이다 — 지호님께 보고만 한다.
