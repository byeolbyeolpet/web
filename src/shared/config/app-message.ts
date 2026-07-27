// 사용자 노출 문구 중앙 관리 — toast·alert·error UI 전용 (app-message-convention).
// 원본 Supabase/Auth 에러는 사용자에게 노출하지 않는다(console.error 로만).

export const APP_MESSAGE = {
  auth: {
    signInFailed: {
      title: "로그인 실패",
      description: "잠시 후 다시 시도해 주세요.",
    },
    signOutFailed: {
      title: "로그아웃 실패",
      description: "잠시 후 다시 시도해 주세요.",
    },
    signInRequired: {
      title: "로그인 필요",
      description: "이 기능은 로그인 후 이용할 수 있어요.",
    },
  },
  profile: {
    updateDone: { title: "닉네임 변경 완료" },
    updateFailed: {
      title: "닉네임 변경 실패",
      description: "잠시 후 다시 시도해 주세요.",
    },
    loadFailed: {
      title: "프로필 불러오기 실패",
      description: "프로필을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  },
  pet: {
    createDone: { title: "등록했어요" },
    createFailed: {
      title: "등록하지 못했어요",
      description: "잠시 후 다시 시도해주세요",
    },
    loadFailed: {
      title: "불러오지 못했어요",
      description: "잠시 후 다시 시도해주세요",
    },
  },
} as const;
