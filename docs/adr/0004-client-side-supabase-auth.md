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
- **미결 — 세션 저장소(쿠키 vs localStorage)**: `client.ts`는 `@supabase/ssr`의 `createBrowserClient`를 쓰는데 이 함수는 **쿠키 저장이 기본**이라 위 "localStorage 계열" 문구와 어긋난다.

  판단에 필요한 사실관계를 정리해 둔다.
  - **Supabase는 쿠키를 읽지 않는다.** 요청 인증은 `Authorization: Bearer <JWT>` 헤더로 간다. 세션을 쿠키에 두든 localStorage에 두든 `supabase-js`가 꺼내서 헤더에 싣는다. 따라서 저장소 선택은 **서버가 읽느냐의 문제가 아니다.**
  - 쿠키 저장(`@supabase/ssr`)의 존재 이유는 **Next 서버가 SSR/미들웨어에서 세션을 읽기 위해서**다. 우리는 그 Next 서버가 없으므로 이 경로가 쓰이지 않는다.
  - 흔한 "쿠키가 XSS에 더 안전하다"는 `httpOnly` 쿠키 얘기다. `createBrowserClient`는 `document.cookie`로 JS가 직접 쓰므로 **JS에서 읽히며, localStorage와 노출도가 같다.**
  - 남는 실질 기준은 **WebView 영속성** 하나다. 확인 필요 항목: Capacitor 커스텀 스킴(`capacitor://localhost`)에서 쿠키가 앱 재시작·업데이트 후에도 유지되는지, iOS ITP의 JS 쿠키 수명 제한이 강제 재로그인을 유발하는지.

  실기기에서 재로그인 유지를 확인해야 결론이 나므로 **인증(auth) 구현 이슈에서 실측 후 확정**하고, 그때 `@supabase/ssr` 의존성 제거 여부도 함께 판단한다.

## 결과

**긍정**
- Static Export와 정합. Supabase Auth·OAuth·RLS 전부 그대로 사용.
- 서버 배관이 사라져 구조가 단순.

**부정 / 트레이드오프**
- 서버 사이드 세션 보호/미들웨어 게이팅이 없다 → **라우트 가드는 클라이언트**에서 한다(로그인 필요한 화면은 클라 세션 확인 후 리다이렉트).
- 첫 렌더에 인증 상태가 미확정인 구간이 있다(클라이언트 하이드레이션 후 확정). 로딩 처리 필요.

## 고려한 대안

- **`@supabase/ssr` 서버 클라이언트 유지(server.ts/middleware.ts)**: 이 코드가 돌 Next 서버 런타임이 없는 우리 환경에선 무의미. 배제.
