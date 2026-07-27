"use client";
// 펫 등록 폼 — 이름·종·성별 3필드. 필드 오류는 필드 아래에만 표시하고
// 제출 실패(서버)만 toast 로 알린다(app-message-convention).

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { PET_SEX_LABEL } from "@/entities/pet";
import { SpeciesPicker } from "@/entities/species";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { RadioCard, RadioCards } from "@/shared/ui/radio-cards";
import { useCreatePet } from "../api/use-create-pet";
import { petFormSchema, type PetFormValues } from "../model/schema";

export function PetForm({ ownerId }: { ownerId: string }) {
  const router = useRouter();
  const createPet = useCreatePet(ownerId);

  // 라벨·오류를 aria 로 잇는 id. 한 화면에 폼이 두 벌 떠도 겹치지 않게 useId 로 만든다.
  const uid = useId();
  const speciesLabelId = `${uid}-species-label`;
  const speciesErrorId = `${uid}-species-error`;
  const nameInputId = `${uid}-name`;
  const nameErrorId = `${uid}-name-error`;
  const sexLabelId = `${uid}-sex-label`;
  const sexErrorId = `${uid}-sex-error`;

  const form = useForm<PetFormValues>({
    resolver: zodResolver(petFormSchema),
    defaultValues: { name: "", speciesCode: "", sex: "unknown" },
  });

  const onSubmit = (values: PetFormValues) =>
    createPet.mutate(values, { onSuccess: () => router.replace("/me") });

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-1 flex-col gap-6 p-4 pb-safe-bottom"
    >
      {/* 종·성별은 radiogroup 이라 <label htmlFor> 로는 이름이 붙지 않는다.
          fieldset/legend 로 묶고 그룹 자신에게 aria-labelledby 로 legend 를 가리킨다. */}
      <Controller
        control={form.control}
        name="speciesCode"
        render={({ field, fieldState }) => (
          <FieldSet className="gap-2" data-invalid={fieldState.invalid}>
            <FieldLegend variant="label" id={speciesLabelId} className="mb-0">
              종류
            </FieldLegend>
            <SpeciesPicker
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              aria-labelledby={speciesLabelId}
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.invalid ? speciesErrorId : undefined}
            />
            {fieldState.invalid && (
              <FieldError id={speciesErrorId} errors={[fieldState.error]} />
            )}
          </FieldSet>
        )}
      />

      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={nameInputId}>이름</FieldLabel>
            <Input
              {...field}
              id={nameInputId}
              placeholder="코코"
              maxLength={20}
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.invalid ? nameErrorId : undefined}
            />
            {fieldState.invalid && (
              <FieldError id={nameErrorId} errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="sex"
        render={({ field, fieldState }) => (
          <FieldSet className="gap-2" data-invalid={fieldState.invalid}>
            <FieldLegend variant="label" id={sexLabelId} className="mb-0">
              성별
            </FieldLegend>
            <RadioCards
              className="grid-cols-3"
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              aria-labelledby={sexLabelId}
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.invalid ? sexErrorId : undefined}
            >
              {/* 라벨과 순서 모두 entities/pet 의 정의를 따른다 — 카드 표기와 어긋나지 않게. */}
              {Object.entries(PET_SEX_LABEL).map(([value, label]) => (
                <RadioCard key={value} value={value}>
                  {label}
                </RadioCard>
              ))}
            </RadioCards>
            {fieldState.invalid && (
              <FieldError id={sexErrorId} errors={[fieldState.error]} />
            )}
          </FieldSet>
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
  );
}
