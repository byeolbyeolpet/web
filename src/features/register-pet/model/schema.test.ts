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
