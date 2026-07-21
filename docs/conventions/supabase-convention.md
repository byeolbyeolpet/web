# Supabase 컨벤션

> **핵심 전제**: 우리는 Static Export라 **서버가 없다.** 그래서 PixelPlay식 `admin client`/`service_role` 서버 read가 **불가능**하다. 이 제약이 아래 read/write 전략을 결정한다. ([ADR-0002](../adr/0002-static-export.md))

## 1. 타입 동기화

스키마(테이블·컬럼·enum·RPC·trigger)가 바뀌면 즉시 TypeScript 타입을 갱신한다.

- 방법: Supabase MCP `generate_typescript_types`, 또는 (Supabase CLI 세팅 후) `npm run db:types`.
- 출력: `shared/lib/supabase/database.types.ts`.

## 2. 마이그레이션 최신화

- 적용은 Supabase MCP `apply_migration` 또는 대시보드 SQL Editor.
- **적용한 SQL은 반드시 `supabase/migrations/`에 파일로 남긴다.** 파일명 `YYYYMMDDHHMMSS_작업_내용.sql`.
- 파일은 실제 적용 SQL과 동등해야 하고, 이후 타입을 갱신한다.
- 대상: 테이블·컬럼·RPC·trigger·제약 등 DB 스키마/로직 변화 전부.

## 3. 로직 위치

- 복잡한 필터링·트랜잭션 등 DB 계층이 효율적인 로직은 PostgreSQL 함수(RPC)로 뺀다.
- 동시성 이슈가 우려되는 부분은 적용 전 사용자와 상의한다.
- 데이터 접근은 **브라우저 client 하나** (`shared/lib/supabase/client.ts`)로만 한다. `server.ts`/admin client는 없다.

## 4. read/write 전략 — 전부 브라우저 client

서버가 없으므로 read든 write든 **브라우저 client + TanStack Query**로 한다.

- **read**: `useQuery`의 `queryFn`에서 `.rpc()`/`.from()` 직접 호출 → `use-query-*` 훅으로 감싼다.
- **write(mutation)**: `useMutation` → 성공 시 관련 `invalidateQueries`.
- 캐시 공유로 props drilling을 피하고, mutation 후 즉시 갱신한다.

### 보안 모델 (서버가 없기 때문에)

- **모든 RPC·테이블은 `authenticated`에 grant + RLS(`auth.uid() = user_id`)로 보호**한다. 권한 판단은 DB(RLS)가 한다.
- `p_actor_user_id` 같은 **신뢰 파라미터 패턴 금지** — 브라우저에서 다른 유저 id를 넣어 위조할 수 있다. 행위자는 항상 `auth.uid()`로 DB에서 잡는다.
- `service_role`/비밀키가 필요한 로직(Gemini 호출, 공공데이터 정제, 관리 작업)은 **Supabase Edge Function**으로 뺀다. 브라우저엔 절대 두지 않는다.

## 5. 변경 후 검증

- RPC·RLS·table·trigger·function이 바뀌면 MCP `execute_sql`로 원격 상태를 확인한다.
- RPC 변경 후: `pg_proc`, `search_path`, `security invoker/definer`, `authenticated` 실행 권한 확인.
- 제약 변경 후: `pg_constraint`에서 실제 적용 여부 확인.
- Advisor: 무료 플랜으로 못 고치는 `Leaked Password Protection Disabled`는 수정 대상으로 보지 않는다. Performance Advisor 경고는 남았는지 확인한다.
