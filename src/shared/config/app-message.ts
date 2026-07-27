// 사용자 노출 문구 중앙 관리 — toast·alert·error UI 전용 (app-message-convention).
// 원본 Supabase/Auth 에러는 사용자에게 노출하지 않는다(console.error 로만).
//
// 키는 "도메인.이름" 형태의 평평한 메시지 코드다. 중첩 객체가 아니라 코드를
// 키로 두는 이유는 코드 하나로 문구를 찾을 수 있어야 하기 때문이다 —
// toastAppError(code) 같은 헬퍼가 as 단언 없이 조회한다.
//
// 호출부는 이 객체에 문자열을 직접 넣지 않고 항상 APP_MESSAGE_CODE 를 거친다.

export type AppMessage = { title: string; description?: string };

export const APP_MESSAGE = {
  "auth.signInFailed": {
    title: "로그인 실패",
    description: "잠시 후 다시 시도해 주세요.",
  },
  "auth.signOutFailed": {
    title: "로그아웃 실패",
    description: "잠시 후 다시 시도해 주세요.",
  },
  "auth.signInRequired": {
    title: "로그인 필요",
    description: "이 기능은 로그인 후 이용할 수 있어요.",
  },
  "profile.updateDone": { title: "닉네임 변경 완료" },
  "profile.updateFailed": {
    title: "닉네임 변경 실패",
    description: "잠시 후 다시 시도해 주세요.",
  },
  "profile.loadFailed": {
    title: "프로필 불러오기 실패",
    description: "프로필을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
  },
  "pet.createDone": { title: "반려동물 등록 완료" },
  "pet.createFailed": {
    title: "반려동물 등록 실패",
    description: "잠시 후 다시 시도해 주세요.",
  },
  "pet.loadFailed": {
    title: "반려동물 목록 불러오기 실패",
    description: "목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
  },
} as const satisfies Record<string, AppMessage>;

export type AppMessageCode = keyof typeof APP_MESSAGE;

// 위 코드를 도메인별로 갈라 놓은 것 — 호출부가 코드 문자열을 직접 쓰지 않게 한다.
// satisfies 가 값이 실재하는 코드인지 검사하고, 경로("도메인.key")와 값이
// 어긋나거나 한쪽에만 있는 것은 app-message.test.ts 가 잡는다.
export const APP_MESSAGE_CODE = {
  auth: {
    signInFailed: "auth.signInFailed",
    signOutFailed: "auth.signOutFailed",
    signInRequired: "auth.signInRequired",
  },
  profile: {
    updateDone: "profile.updateDone",
    updateFailed: "profile.updateFailed",
    loadFailed: "profile.loadFailed",
  },
  pet: {
    createDone: "pet.createDone",
    createFailed: "pet.createFailed",
    loadFailed: "pet.loadFailed",
  },
} as const satisfies Record<string, Record<string, AppMessageCode>>;
