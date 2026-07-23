# 아키텍처 결정 기록 (ADR)

이 폴더는 **"무엇을, 왜 그렇게 정했나"** 를 남긴다. 별별펫의 목표가 "판단을 문서로 남기기"(취업 포트폴리오)이므로, 되돌리기 어렵거나 반복해서 흔들리는 결정은 여기 박아 휘발을 막는다.

각 ADR은 `맥락 → 결정 → 결과(트레이드오프) → 대안` 순서다. 상태가 `채택`이면 현행, `대체됨`이면 상단에 후속 ADR을 가리킨다.

## 목록

| # | 제목 | 상태 |
|---|---|---|
| [0001](0001-app-only-webview-delivery.md) | 앱-only WebView 배포 — web은 앱 화면 substrate | 채택 |
| [0002](0002-static-export.md) | Static Export(`output: 'export'`) 채택 | 채택 |
| [0003](0003-keep-nextjs-over-vite.md) | 프레임워크로 Next.js 유지 (vs Vite) | 채택 |
| [0004](0004-client-side-supabase-auth.md) | 클라이언트 사이드 Supabase Auth — 서버 스캐폴드 제거 | 채택 |
| [0005](0005-species-code-system.md) | 종 코드 체계 — 입도는 "병원이 갈리는 단위", 품종은 breeds | 채택 |

> 2026-07-21: 0001~0004는 "web을 독립 사이트/SEO 채널로 볼 것인가"라는 반복 혼란을 끝내기 위해 한 세션에서 함께 확정했다. 뿌리는 0001이다.
