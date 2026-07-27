// 폼 필드 검증 문구 중앙 관리 — Zod·RHF FieldError 로 필드 아래에 표시한다.
// 필드 메시지는 toast 로 중복 노출하지 않는다 (app-message-convention).
// 인라인 오류는 마침표를 붙이지 않는다 — 문장이 아니라 라벨에 가깝다.

export const FORM_MESSAGE = {
  pet: {
    nameRequired: "이름을 입력해주세요",
    nameTooLong: "이름은 20자까지 쓸 수 있어요",
    speciesRequired: "종류를 선택해주세요",
  },
} as const;
