---
description: Supabase 타입 재생성 — database.types.ts 최신화
---

Supabase 스키마(테이블·컬럼·enum·RPC 등)가 바뀐 뒤 TypeScript 타입을 재생성한다. `docs/conventions/supabase-convention.md` 1장을 따른다.

1. MCP `generate_typescript_types`로 최신 타입을 받는다.
2. `src/shared/lib/supabase/database.types.ts`에 쓴다. 파일 첫 줄에 `// Supabase 자동 생성 — 직접 수정 금지` 주석을 둔다.
3. `npm run typecheck`로 타입이 물리는지 확인한다.

스키마 변경이 없으면 실행하지 않는다.
