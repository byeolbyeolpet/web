# ADR-0004: 클라이언트 사이드 Supabase Auth — 서버 스캐폴드 제거

- 상태: 채택
- 날짜: 2026-07-21
- 관련: [0002](0002-static-export.md), CLAUDE.md "데이터 — Supabase"

## 맥락

Supabase 표준 Next.js 스캐폴드가 `src/shared/lib/supabase/`에 들어왔다: `client.ts`(브라우저), `server.ts`(서버·쿠키), `middleware.ts`(proxy·세션 갱신·리다이렉트). 뒤 둘은 **Next를 서버로 돌린다는 가정**의 코드다. 우리는 Static Export(ADR-0002)라 **Next 서버 런타임이 없으므로**(백엔드는 Supabase다) 이 둘은 **실행될 자리가 없는 죽은 코드**다.

한편 인증 자체는 Supabase Auth(kakao/google OAuth)를 그대로 쓴다 — Supabase Auth는 **브라우저에서 도는** 인증이라 서버가 필요 없다.

## 결정

- 인증·데이터 접근은 전부 **브라우저 클라이언트**로 한다. 로그인 세션은 클라이언트에 저장(localStorage 계열)하고, 요청마다 토큰을 실어 보낸다.
- 개인화 권한 차단은 **RLS**(`auth.uid() = user_id`)로 DB에서 끝낸다.
- `server.ts`, `middleware.ts`(→ Next 16에서는 `proxy.ts`)를 **제거**한다. `client.ts`만 유지한다.
- 물리적 삭제와 `client.ts`의 최종 형태(순수 SPA에 맞게 세션 스토리지를 쿠키 대신 localStorage로 다듬는 것)는 **데이터 계층 설계 단계에서** 확정한다.

### 이행 상태 (2026-07-22, #4 코어 스키마)

- **물리 삭제 완료** — `server.ts`·`proxy.ts` 제거. 스키마·RLS·타입이 적용돼 데이터 계층 설계 단계에 진입했으므로 예약해 둔 삭제를 이행했다. (두 파일은 한때 커밋돼 있었고 git 히스토리에 남는다.)
- **~~미결~~ → 확정 (2026-07-24, [#28](https://github.com/byeolbyeolpet/web/issues/28)) — 세션 저장소는 네이티브 Preferences**: `client.ts`는 `@supabase/supabase-js`의 `createClient`에 **`@capacitor/preferences` 기반 커스텀 storage 어댑터**를 주입한다(iOS UserDefaults / Android SharedPreferences). `@supabase/ssr` 의존성은 제거했다.

  판단에 필요했던 사실관계(2026-07-22 정리분, 유효):
  - **Supabase는 쿠키를 읽지 않는다.** 요청 인증은 `Authorization: Bearer <JWT>` 헤더로 간다. 저장소 선택은 **서버가 읽느냐의 문제가 아니다.**
  - 쿠키 저장(`@supabase/ssr`)의 존재 이유는 Next 서버가 SSR/미들웨어에서 세션을 읽기 위해서다. 우리는 그 서버가 없으므로 이 경로가 쓰이지 않는다.
  - `createBrowserClient`의 쿠키는 JS가 쓰므로 httpOnly가 아니다 — **XSS 노출도는 localStorage와 같다.** 기기 내 보안은 세 후보 모두 앱 샌드박스 수준으로 동급.
  - 남는 실질 기준은 **WebView 영속성** 하나다.

  실측과 결정 근거 (2026-07-24, 안드로이드 에뮬레이터 Pixel 8):
  - **origin은 `https://localhost`** (커스텀 origin 가설 실측 확인, UA에 WebView 마커 `wv`).
  - 쿠키·localStorage·Preferences 3종 마커가 **앱 완전 종료 후 재시작·재배포·재부팅 모두 생존** — 안드로이드에서는 무승부.
  - 판별 기준이 남은 리스크로 이동: ① **iOS 미검증**(WebKit ITP의 JS 쿠키/스토리지 수명 제한이 WKWebView에 적용되는지) ② **OS 저장공간 청소** — Capacitor 공식 문서가 "모바일 OS가 localStorage를 주기적으로 지울 수 있다"며 Preferences를 권장. **네이티브 저장소만 두 리스크 모두 회피한다** — WebView 데이터가 아니기 때문이다.
  - `@supabase/auth-js`의 `SupportedStorage`는 `getItem/setItem/removeItem`의 **Promise 버전을 허용**(설치 소스 확인) — 비동기 네이티브 어댑터가 정식 지원 경로다.
  - 웹(브라우저)에서는 Preferences가 localStorage로 폴백되므로 같은 코드가 양쪽에서 돈다. 어댑터 경유 `getSession()`과 REST 조회(species 14행)를 브라우저에서 확인했다.
  - **iOS 실기 검증은 보류** — macOS 보유로 가능은 하나 Xcode 세팅이 크다. Preferences 선택으로 iOS 불확실성이 결정의 전제조건에서 빠졌으므로, **iOS 빌드 착수 시 재검증 항목**으로만 남긴다.
  - **iOS 출시 전 의무 작업**: `@capacitor/preferences`는 iOS에서 `UserDefaults`를 쓰므로 App Store 제출 전 `PrivacyInfo.xcprivacy`에 `NSPrivacyAccessedAPICategoryUserDefaults` + 사유 `CA92.1`을 선언해야 한다(Apple required-reason API, Capacitor 공식 문서 명시).

  **열어둔 선택지 — 세션을 서버 측에서 관리**: 앱/웹이 세션을 각자 들고 왔다 갔다 하는 대신 Supabase(또는 Redis 같은 세션 스토어)에 두고 서버에서 불러오는 구성. 앱과 웹이 같은 세션을 공유해야 하거나 서버에서 세션을 검증해야 할 때 유리하다. 단 이 구성은 **세션을 읽을 서버 실행 지점**을 요구하므로(Edge Function 등) 현재의 2-tier 전제와 충돌하는지부터 따져야 한다. 필요가 생기면 그때 재검토한다(현재는 해당 없음).

## 결과

**긍정**
- Static Export와 정합. Supabase Auth·OAuth·RLS 전부 그대로 사용.
- 서버 배관이 사라져 구조가 단순.

**부정 / 트레이드오프**
- 서버 사이드 세션 보호/미들웨어 게이팅이 없다 → **라우트 가드는 클라이언트**에서 한다(로그인 필요한 화면은 클라 세션 확인 후 리다이렉트).
- 첫 렌더에 인증 상태가 미확정인 구간이 있다(클라이언트 하이드레이션 후 확정). 로딩 처리 필요.

## 고려한 대안

- **`@supabase/ssr` 서버 클라이언트 유지(server.ts/middleware.ts)**: 이 코드가 돌 Next 서버 런타임이 없는 우리 환경에선 무의미. 배제.
