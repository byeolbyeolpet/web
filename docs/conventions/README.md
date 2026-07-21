# 컨벤션 문서

사용자가 즐겨 쓰던 컨벤션을 **별별펫(FSD · Static Export · 클라이언트 전용 Supabase)** 에 맞게 적응한 것이다. PixelPlay 전용(Server Actions, `admin client`, `proxy.ts`, mint/coral 컬러 등)은 걷어냈다.

| 문서 | 다루는 것 |
|---|---|
| [code-convention](code-convention.md) | 네이밍·파일명·훅·Query Key |
| [srp-convention](srp-convention.md) | FSD 안에서의 단일 책임·슬라이스/세그먼트 구조 |
| [supabase-convention](supabase-convention.md) | 타입 동기화·마이그레이션·클라이언트 read/write·RLS |
| [design-convention](design-convention.md) | 토큰·cn·모바일 우선·shadcn·Dialog |
| [app-message-convention](app-message-convention.md) | APP_MESSAGE / FORM_MESSAGE 사용자 문구 |
| [validation-convention](validation-convention.md) | 검증 순서·권한·실패 보고 |
| [git-convention](git-convention.md) | 커밋·브랜치·PR·저자 규칙 |

레이어별 역할·의존 방향은 각 레이어의 `src/<layer>/README.md`를 함께 본다.
