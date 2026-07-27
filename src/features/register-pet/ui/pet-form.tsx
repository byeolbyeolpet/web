"use client";
// 펫 등록 폼 — 이름·종·성별 3필드. 필드 오류는 필드 아래에만 표시하고
// 제출 실패(서버)만 toast 로 알린다(app-message-convention).

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { PET_SEX_LABEL } from "@/entities/pet";
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
              <FormLabel>종류</FormLabel>
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
                  {/* 라벨과 순서 모두 entities/pet 의 정의를 따른다 — 카드 표기와 어긋나지 않게. */}
                  {Object.entries(PET_SEX_LABEL).map(([value, label]) => (
                    <RadioCard key={value} value={value}>
                      {label}
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
