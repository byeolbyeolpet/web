"use client";
// 펫 등록 폼 — 이름·종·성별 3필드. 필드 오류는 필드 아래에만 표시하고
// 제출 실패(서버)만 toast 로 알린다(app-message-convention).

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { m } from "motion/react";
import { useRouter } from "next/navigation";
import {
  Controller,
  useForm,
  type FieldError as RhfFieldError,
} from "react-hook-form";
import { riseIn, riseInList } from "@/shared/lib/motion";
import { cn } from "@/shared/lib/utils";
import { PET_SEX_CHOICES, PET_SEX_LABEL } from "@/entities/pet";
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

/**
 * 오류 문구가 갑자기 나타나면 그 줄만큼 아래 내용이 튄다. 높이를 함께
 * 전환해 밀려나는 과정이 보이게 한다. `grid-rows-[0fr]`→`[1fr]` 은 height:auto
 * 를 transition 할 수 있는 유일한 CSS 방법이다(height 는 auto 로 전환되지 않는다).
 */
function FieldErrorSlot({ id, error }: { id: string; error?: RhfFieldError }) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-150 ease-out",
        error ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="overflow-hidden">
        <FieldError id={id} errors={error ? [error] : []} />
      </div>
    </div>
  );
}

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
    /* 필드가 한꺼번에 나타나면 정보량이 많아 보인다. 위에서부터 차례로 올려
       읽는 순서를 만든다. CTA(sticky)는 stagger 에서 뺀다 — transform 이 걸린
       조상은 sticky 의 기준 박스를 바꿔 하단 고정이 깨진다. */
    <m.form
      variants={riseInList}
      initial="hidden"
      animate="visible"
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-1 flex-col gap-8 px-4"
    >
      {/* 종·성별은 radiogroup 이라 <label htmlFor> 로는 이름이 붙지 않는다.
          fieldset/legend 로 묶고 그룹 자신에게 aria-labelledby 로 legend 를 가리킨다. */}
      <Controller
        control={form.control}
        name="speciesCode"
        render={({ field, fieldState }) => (
          <m.div variants={riseIn}>
            <FieldSet className="gap-2" data-invalid={fieldState.invalid}>
              <FieldLegend
                variant="label"
                id={speciesLabelId}
                className="mb-2 text-muted-foreground"
              >
                종류
              </FieldLegend>
              <SpeciesPicker
                collapsible
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
                aria-labelledby={speciesLabelId}
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.invalid ? speciesErrorId : undefined
                }
              />
              <FieldErrorSlot id={speciesErrorId} error={fieldState.error} />
            </FieldSet>
          </m.div>
        )}
      />

      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <m.div variants={riseIn}>
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel
                htmlFor={nameInputId}
                className="text-muted-foreground"
              >
                이름
              </FieldLabel>
              <Input
                {...field}
                id={nameInputId}
                placeholder="코코"
                maxLength={20}
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.invalid ? nameErrorId : undefined}
              />
              <FieldErrorSlot id={nameErrorId} error={fieldState.error} />
            </Field>
          </m.div>
        )}
      />

      <Controller
        control={form.control}
        name="sex"
        render={({ field, fieldState }) => (
          <m.div variants={riseIn}>
            <FieldSet className="gap-2" data-invalid={fieldState.invalid}>
              <FieldLegend
                variant="label"
                id={sexLabelId}
                className="mb-2 text-muted-foreground"
              >
                성별
              </FieldLegend>
              <RadioCards
                className="grid-cols-2"
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
                aria-labelledby={sexLabelId}
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.invalid ? sexErrorId : undefined}
              >
                {/* 라벨과 순서 모두 entities/pet 의 정의를 따른다 — 카드 표기와 어긋나지 않게.
                  unknown 은 선택지가 아니다: 안 고르면 그 값이 그대로 저장된다. */}
                {PET_SEX_CHOICES.map((value) => (
                  <RadioCard key={value} value={value}>
                    {PET_SEX_LABEL[value]}
                  </RadioCard>
                ))}
              </RadioCards>
              <FieldErrorSlot id={sexErrorId} error={fieldState.error} />
            </FieldSet>
          </m.div>
        )}
      />

      {/* 종 14칸 + 이름 + 성별이면 모바일에서 반드시 스크롤이 생긴다. mt-auto 로
          바닥에 붙이면 CTA 를 만나려고 끝까지 내려야 하므로 하단에 고정한다.
          safe-area 는 (full) layout 의 main 이 갖고 있고, sticky 는 부모
          padding box 를 넘지 못하므로 홈 인디케이터 위에서 알아서 멈춘다. */}
      <div className="sticky bottom-0 -mx-4 mt-auto border-t border-border bg-background/85 px-4 pt-3 pb-4 backdrop-blur-md">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={createPet.isPending}
        >
          등록하기
        </Button>
      </div>
    </m.form>
  );
}
