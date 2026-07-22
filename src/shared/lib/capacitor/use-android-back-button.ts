// Android 하드웨어 백버튼을 히스토리와 연결한다.
// 기본 동작이 '앱 종료'라 그대로 두면 글 상세에서 뒤로 눌렀을 때 앱이 꺼진다.
"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

export function useAndroidBackButton() {
  useEffect(() => {
    // 브라우저에는 하드웨어 백버튼이 없다. 네이티브에서만 붙인다.
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        // Next App Router 도 같은 history 를 쓰므로 그대로 뒤로 간다.
        window.history.back();
      } else {
        // 루트 화면에서는 원래대로 앱을 종료한다.
        void App.exitApp();
      }
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, []);
}
