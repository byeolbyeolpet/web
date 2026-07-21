# shared

특정 도메인에 묶이지 않는 재사용 기반. 가장 아래 레이어다.

- `ui/` — shadcn 컴포넌트 (components.json alias: `@/shared/ui`)
- `lib/` — `cn`, supabase 클라이언트, hooks 등
- `config/` — 상수, 환경, 앱 메시지 상수(`APP_MESSAGE` 등)

**규칙**

- **import 가능**: 없음 (최하위). 위 모든 레이어가 여기를 쓴다.
- **도메인 지식이 없어야 한다.** 여기에 pet/place 같은 개념이 새면 `entities`로 올린다.
