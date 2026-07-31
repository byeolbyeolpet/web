// 인증 E2E 의 공용 설정 — playwright.config 와 setup·spec 이 함께 본다.
//
// 자격증명은 .env.local 에만 둔다. 저장소가 퍼블릭이고 .env* 는 커밋 금지다.

import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

// Playwright 는 Next 와 달리 .env.local 을 자동으로 읽지 않는다.
loadEnv({ path: resolve(process.cwd(), ".env.local"), quiet: true });

export const AUTH_STATE_PATH = resolve(process.cwd(), "e2e/.auth/state.json");

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

// 하나만 있으면 설정 실수다 — 조용히 건너뛰면 "인증 E2E 가 도는 줄 알았는데
// 내내 skip 이었다"가 된다. 반쪽 설정은 시끄럽게 죽인다(CodeRabbit 지적).
if (Boolean(email) !== Boolean(password)) {
  throw new Error(
    "E2E_USER_EMAIL / E2E_USER_PASSWORD 는 둘 다 있거나 둘 다 없어야 한다 — .env.local 을 확인하라.",
  );
}

/** 둘 다 있을 때만 자격증명으로 친다. 없으면 authenticated 프로젝트가 건너뛴다. */
export const E2E_CREDENTIALS =
  email && password ? { email, password } : undefined;

/** 인증이 필요한 spec 의 맨 위에 걸어 계정 없는 환경에서 건너뛰게 한다. */
export const SKIP_WITHOUT_ACCOUNT = {
  condition: !E2E_CREDENTIALS,
  reason:
    "테스트 계정이 없다. .env.local 에 E2E_USER_EMAIL / E2E_USER_PASSWORD 를 넣으면 실행된다.",
} as const;
