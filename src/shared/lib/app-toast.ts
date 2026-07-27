// APP_MESSAGE 코드 하나로 toast 를 띄운다 — 호출부가 title·description 을 매번
// 조립하지 않게 하고, 원본 Supabase/Auth 에러가 사용자 화면으로 새는 경로를
// 여기 한 곳으로 좁힌다(app-message-convention).

import { toast } from "sonner";
import {
  APP_MESSAGE,
  type AppMessage,
  type AppMessageCode,
} from "@/shared/config/app-message";

export function toastAppSuccess(code: AppMessageCode) {
  const message: AppMessage = APP_MESSAGE[code];
  toast.success(message.title, { description: message.description });
}

// cause 는 개발자용이다 — 콘솔로만 나가고 사용자에겐 고정 문구만 보인다.
export function toastAppError(code: AppMessageCode, cause?: unknown) {
  console.error(code, cause);
  const message: AppMessage = APP_MESSAGE[code];
  toast.error(message.title, { description: message.description });
}
