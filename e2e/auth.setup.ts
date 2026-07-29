// 인증 E2E 의 사전 단계 — 테스트 계정으로 로그인한 세션을 storageState 로 굽는다.
//
// **왜 UI 로 로그인하지 않는가.** 이 앱의 로그인 수단은 Google OAuth 뿐이다.
// 구글 동의 화면은 봇 탐지가 걸려 자동화할 수 없고 해서도 안 된다. 그래서 세션은
// GoTrue 토큰 엔드포인트로 직접 받아 브라우저 저장소에 심는다. 검증 대상은
// "로그인 방법"이 아니라 "로그인된 뒤의 화면"이므로 이 대체는 손실이 없다.
//
// **키 이름이 특이한 이유.** 세션 저장소가 @capacitor/preferences 다(ADR-0004).
// 웹에서는 localStorage 로 폴백되는데 그때 키에 `CapacitorStorage.` 접두사가
// 붙는다(node_modules/@capacitor/preferences 의 PreferencesWeb.prefix).
// 접두사를 빼면 앱이 세션을 못 찾아 로그인 화면으로 튕긴다.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { expect, test as setup } from "@playwright/test";
import { AUTH_STATE_PATH, E2E_CREDENTIALS } from "./auth-config";

setup("테스트 계정 세션 굽기", async ({ baseURL }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // 자격증명이 없으면 실패가 아니라 건너뛴다. 계정 없는 사람도 나머지 E2E 는
  // 그대로 돌 수 있어야 한다. 다만 빈 상태 파일은 남긴다 — storageState 가
  // 가리키는 파일이 없으면 Playwright 가 설정 오류로 죽는다.
  if (!E2E_CREDENTIALS || !supabaseUrl || !supabaseKey) {
    writeState({ cookies: [], origins: [] });
    setup.skip(
      true,
      "E2E_USER_EMAIL / E2E_USER_PASSWORD 가 .env.local 에 없다 — 인증 E2E 를 건너뛴다.",
    );
    return;
  }

  const response = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: { apikey: supabaseKey, "Content-Type": "application/json" },
      body: JSON.stringify(E2E_CREDENTIALS),
    },
  );

  // 본문은 한 번만 읽을 수 있다. expect 의 메시지 인자는 성공·실패와 무관하게
  // 먼저 평가되므로 거기서 text() 를 부르면 뒤따르는 json() 이 빈 body 를 만난다.
  const body = await response.text();

  // 여기서 실패하면 계정이 없거나 미확인 상태다. 원인이 바로 보이게 본문을 남긴다.
  expect(response.ok, `로그인 실패 (HTTP ${response.status}): ${body}`).toBe(
    true,
  );

  const session = JSON.parse(body);
  expect(session.access_token, "세션에 access_token 이 없다").toBeTruthy();

  // supabase-js 의 기본 storageKey 규칙: sb-<프로젝트 ref>-auth-token
  // (SupabaseClient.ts 의 `sb-${baseUrl.hostname.split('.')[0]}-auth-token`)
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

  writeState({
    cookies: [],
    origins: [
      {
        origin: new URL(baseURL!).origin,
        localStorage: [
          {
            name: `CapacitorStorage.sb-${projectRef}-auth-token`,
            value: JSON.stringify(session),
          },
        ],
      },
    ],
  });
});

function writeState(state: unknown) {
  mkdirSync(dirname(AUTH_STATE_PATH), { recursive: true });
  writeFileSync(AUTH_STATE_PATH, JSON.stringify(state, null, 2));
}

// 상태 파일이 없으면 authenticated 프로젝트가 설정 단계에서 죽는다.
// setup 이 아예 실행되지 않는 경로(예: --grep 로 걸러짐)를 위한 안전망.
if (!existsSync(AUTH_STATE_PATH)) {
  mkdirSync(dirname(AUTH_STATE_PATH), { recursive: true });
  writeFileSync(AUTH_STATE_PATH, JSON.stringify({ cookies: [], origins: [] }));
}
