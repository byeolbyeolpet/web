# ADR-0004: 클라이언트 사이드 Supabase Auth — 서버 스캐폴드 제거

- 상태: 채택
- 날짜: 2026-07-21
- 관련: [0002](0002-static-export.md), CLAUDE.md "데이터 — Supabase"

## 맥락

Supabase 표준 Next.js 스캐폴드가 `src/shared/lib/supabase/`에 들어왔다: `client.ts`(브라우저), `server.ts`(서버·쿠키), `middleware.ts`(proxy·세션 갱신·리다이렉트). 뒤 둘은 **Next를 서버로 돌린다는 가정**의 코드다. 우리는 Static Export(ADR-0002)라 서버가 없으므로 이 둘은 **실행될 자리가 없는 죽은 코드**다.

한편 인증 자체는 Supabase Auth(kakao/google OAuth)를 그대로 쓴다 — Supabase Auth는 **브라우저에서 도는** 인증이라 서버가 필요 없다.

## 결정

- 인증·데이터 접근은 전부 **브라우저 클라이언트**로 한다. 로그인 세션은 클라이언트에 저장(localStorage 계열)하고, 요청마다 토큰을 실어 보낸다.
- 개인화 권한 차단은 **RLS**(`auth.uid() = user_id`)로 DB에서 끝낸다.
- `server.ts`, `middleware.ts`를 **제거**한다. `client.ts`만 유지한다.
- 물리적 삭제와 `client.ts`의 최종 형태(순수 SPA에 맞게 세션 스토리지를 쿠키 대신 localStorage로 다듬는 것)는 **데이터 계층 설계 단계에서** 확정한다. 그때까지 두 파일은 import되지 않는 미추적(untracked) 상태로 남겨 빌드에 영향을 주지 않는다.

## 결과

**긍정**
- Static Export와 정합. Supabase Auth·OAuth·RLS 전부 그대로 사용.
- 서버 배관이 사라져 구조가 단순.

**부정 / 트레이드오프**
- 서버 사이드 세션 보호/미들웨어 게이팅이 없다 → **라우트 가드는 클라이언트**에서 한다(로그인 필요한 화면은 클라 세션 확인 후 리다이렉트).
- 첫 렌더에 인증 상태가 미확정인 구간이 있다(클라이언트 하이드레이션 후 확정). 로딩 처리 필요.

## 고려한 대안

- **`@supabase/ssr` 서버 클라이언트 유지(server.ts/middleware.ts)**: 서버가 없는 우리 환경에선 무의미. 배제.
