// 펫 등록 폼 검증 — DB 제약(pets_name_length_check)과 같은 범위를 클라이언트에서 먼저 막는다.
// 문구는 FORM_MESSAGE 에서 가져온다(app-message-convention).

import { z } from "zod";
import { FORM_MESSAGE } from "@/shared/config/form-message";

export const petFormSchema = z.object({
  // zod v4 의 .trim() 은 값을 덮어쓰는 check 라 등록 순서대로 실행된다 —
  // 뒤따르는 min/max 는 잘린 값을 본다. DB 의 btrim() 경계와 그래서 일치한다.
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
