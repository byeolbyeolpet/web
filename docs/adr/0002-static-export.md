# ADR-0002: Static Export(`output: 'export'`) 채택

- 상태: 채택
- 날짜: 2026-07-21
- 관련: [0001](0001-app-only-webview-delivery.md), [0003](0003-keep-nextjs-over-vite.md), [0004](0004-client-side-supabase-auth.md), CLAUDE.md "절대 어기면 안 되는 제약"

## 맥락

ADR-0001에 따라 배포 대상은 Capacitor WebView 앱이다. 앱 번들에는 **서버 실행 파일을 넣을 수 없다** — 기기 안의 정적 파일 뭉치를 WebView가 로컬에서 띄우는 구조다.

## 결정

- `next.config.ts`에 **`output: 'export'`** 를 켠다. `next build`가 모든 라우트를 빌드 시점에 정적 HTML/CSS/JS로 프리렌더해 `out/`에 뱉는다.
- 서버가 필요한 로직(Gemini 호출, 비밀키 쓰는 외부 API, 공공데이터 정제)은 전부 **Supabase Edge Functions**로 보낸다.

## 결과

**긍정**
- 앱 번들화 가능. 오프라인 로드. 정적 호스팅 어디든 배포 가능.

**부정 / 트레이드오프 (Static Export가 포기하는 것)**
- SSR, 요청 기반 Route Handler, 쿠키, proxy(구 미들웨어), redirects/rewrites, ISR, Server Actions, Cache Components(`use cache`) 사용 불가.
- 동적 라우트는 `generateStaticParams()` 필수이며 `dynamicParams`가 강제로 `false`다 → **빌드 시점에 존재하지 않는 id는 404.** 런타임 생성 콘텐츠(예: 커뮤니티 글)는 동적 세그먼트로 못 만들고, **클라이언트에서 id로 fetch하는 라우트**로 처리한다. (상세: 라우터 설계 문서)
- `next/image` 기본 최적화 불가 → `images.unoptimized: true`.

**주의**: 이 결정의 근거는 **"앱 번들에 서버를 못 넣는다"** 이지 SEO가 아니다. 과거 문서의 SEO 정당화는 ADR-0001에서 폐기됐다.

## 고려한 대안

- **SSR/ISR로 서버 배포(Vercel 서버 모드)**: 동적 렌더·즉시 데이터 갱신이 강점이나 **앱 번들화 불가**라 배제. (앱-only가 아니게 되면 재검토 가능.)
