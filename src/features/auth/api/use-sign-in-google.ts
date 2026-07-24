// Google 로그인 — 네이티브(계정 시트→idToken)와 웹(개발용 리디렉트)을 가른다 (#31).
"use client";

import { useMutation } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { toast } from "sonner";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { createClient } from "@/shared/lib/supabase/client";

/*
 * 네이티브: Credential Manager 가 OS 계정 바텀시트를 띄운다(브라우저·앱 전환 없음).
 * webClientId 는 "웹 애플리케이션" 유형 클라이언트 ID 다 — idToken 의 audience 를
 * Supabase 가 이 값으로 검증한다. Android 유형 클라이언트는 서명 등록용이라 코드에 없다.
 * 웹: 앱-only 제품이라 개발 확인용 폴백만 — PKCE 리디렉트, 교환은 /auth/callback.
 */
async function signInNative() {
  const supabase = createClient();
  await SocialLogin.initialize({
    google: { webClientId: process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID! },
  });
  // scopes 를 넘기면 안드로이드에서 MainActivity 개조를 요구하며 거부한다(플러그인 제약).
  // idToken 에는 email·이름·사진 클레임이 기본 포함되므로 scopes 가 필요 없다.
  const login = await SocialLogin.login({
    provider: "google",
    options: {},
  });
  const idToken =
    "idToken" in login.result ? (login.result.idToken ?? null) : null;
  if (!idToken) throw new Error("google login: idToken missing");

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error) throw error;
}

async function signInWeb() {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback/` },
  });
  if (error) throw error;
}

export function useSignInGoogle() {
  return useMutation({
    mutationFn: () =>
      Capacitor.isNativePlatform() ? signInNative() : signInWeb(),
    onError: (error) => {
      console.error(error);
      toast.error(APP_MESSAGE.auth.signInFailed.title, {
        description: APP_MESSAGE.auth.signInFailed.description,
      });
    },
  });
}
