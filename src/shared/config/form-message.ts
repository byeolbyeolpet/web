// 폼 필드 검증 문구 중앙 관리 — Zod·RHF FieldError 로 필드 아래에 표시한다.
// 필드 메시지는 toast 로 중복 노출하지 않는다 (app-message-convention).
// 사용자가 입력을 고칠 수 있게 문장형으로 쓴다.

export const FORM_MESSAGE = {
  pet: {
    nameRequired: "이름을 입력해 주세요.",
    nameTooLong: "이름은 20자까지 입력할 수 있어요.",
    speciesRequired: "종류를 선택해 주세요.",
  },
} as const;
