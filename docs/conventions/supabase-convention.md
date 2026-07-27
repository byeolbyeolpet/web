# Supabase 컨벤션

> **핵심 전제**: **백엔드는 Supabase다** — Postgres·Auth·Storage·Edge Functions 전부 Supabase 서버에서 돈다. 없는 것은 "서버"가 아니라 **앱과 Supabase 사이에서 우리가 직접 돌리는 Next 서버 런타임**이다(Static Export라 빌드 산출물이 정적 파일뿐). 그래서 PixelPlay식 `admin client`/`service_role` 서버 read가 **불가능**하다 — 비밀키를 숨길 우리 쪽 실행 지점이 없기 때문이다. 이 제약이 아래 read/write 전략을 결정한다. ([ADR-0002](../adr/0002-static-export.md))
>
> ```text
> [Capacitor 앱 = WebView] ─ 정적 번들(빌드 타임 생성, 런타임 서버 X)
>          └─ 브라우저 JS가 직접 호출 ─→ [Supabase 서버] Postgres·Auth·Storage·Edge Functions
> ```

## 1. 타입 동기화

스키마(테이블·컬럼·enum·RPC·trigger)가 바뀌면 즉시 TypeScript 타입을 갱신한다.

- 방법: Supabase MCP `generate_typescript_types`, 또는 (Supabase CLI 세팅 후) `npm run db:types`.
- 출력: `shared/lib/supabase/database.types.ts`. **생성 파일이므로 직접 수정하지 않는다**(eslint·prettier 예외 처리됨).
- **생성 결과를 그대로 덮어쓰지 않는다.** 파일 1행의 한국어 헤더 주석(`// Supabase 스키마에서 자동 생성된 타입...`)은 생성 산출물에 없다. MCP 출력 앞에 그 줄을 다시 붙여 저장한다(AGENTS.md 파일 헤더 규칙). 덮어쓰기 전에 기존 파일과 diff 해서 본문이 실제로 바뀌었는지도 본다 — check 제약처럼 타입에 영향 없는 변경이면 파일을 건드릴 이유가 없다.

### 생성 타입이 거짓말하는 지점 (반드시 감싸서 쓴다)

typegen이 표현하지 못하는 것이 있다. 아래는 타입을 믿으면 런타임에 깨진다.

- **RPC 반환의 nullability**: `returns table (...)` 형태는 전 컬럼이 non-null로 생성된다. `nearby_places`의 `phone`·`road_address`·`jibun_address`·`external_id`는 실제로 NULL이 온다(LOCALDATA 결측 흔함). 소비 계층(`entities/*`)에서 `Omit` + `Pick<Tables<'places'>, ...>`로 nullable을 복원해 재수출하고, 컴포넌트는 그 타입만 쓴다.
- **생성 컬럼**: `geog`·`search_tsv`는 `Insert`/`Update`에 `?: unknown`으로 열려 있지만 값을 넣으면 Postgres가 거부한다(428C9). write 타입은 `Omit<TablesInsert<'posts'>, 'geog' | 'search_tsv'>`처럼 감싼다.
- **컬럼 단위 권한**: `reviews.is_verified` 등은 타입상 쓸 수 있어 보이지만 DB가 권한으로 막는다. 타입이 아니라 DB가 경계다.

## 2. 마이그레이션 최신화

- 적용은 Supabase MCP `apply_migration` 또는 대시보드 SQL Editor.
- **적용한 SQL은 반드시 `supabase/migrations/`에 파일로 남긴다.** 파일명 `YYYYMMDDHHMMSS_작업_내용.sql`.
- **파일명의 버전은 손으로 만들지 않는다.** `apply_migration` 뒤에 `list_migrations`로 원격이 기록한 version을 확인해 그 값을 그대로 파일명에 쓴다. 로컬 시각(`date`)으로 지으면 원격 기록(UTC)과 어긋나 `supabase migration list`가 미적용으로 오판하고 `db push`가 재실행하다 깨진다.
- 파일은 실제 적용 SQL과 동등해야 하고, 이후 타입을 갱신한다.
- 대상: 테이블·컬럼·RPC·trigger·제약 등 DB 스키마/로직 변화 전부.
- `alter type ... add value`는 같은 트랜잭션에서 그 값을 쓸 수 없다. **enum 값 추가는 단독 마이그레이션으로 분리**한다.

## 3. 로직 위치 — 백엔드 로직은 RPC 를 기본값으로 둔다

데이터 접근은 **브라우저 client 하나** (`shared/lib/supabase/client.ts`)로만 한다. `server.ts`/admin client는 없다.

그런데 브라우저에서 `.from()` 을 여러 번 부르는 것은 **트랜잭션이 아니다.** 우리 쪽 서버 런타임이 없어 중간에 감쌀 지점도 없다. 그래서 아래 셋 중 하나라도 해당하면 **PostgreSQL 함수(RPC)로 뺀다.**

### 3-1. 하나의 트랜잭션이어야 할 때

두 테이블 이상을 함께 바꾸는 쓰기는 전부 여기 해당한다. 브라우저에서 나눠 부르면 **중간 실패가 곧 부분 반영**이고, 되돌릴 방법이 없다.

```text
나쁨: insert posts → insert post_images → insert post_species   (3번의 왕복, 3번의 실패 지점)
좋음: rpc('create_post', {...})                                  (함수 본문이 곧 트랜잭션)
```

함수 본문은 단일 트랜잭션에서 돈다. 예외가 나면 전부 롤백된다.

### 3-2. 동시성이 걸릴 때

**read-modify-write 를 브라우저에서 하면 lost update 가 난다.** 두 사용자가 동시에 읽으면 같은 값을 보고, 나중 쓰기가 앞의 것을 덮는다.

- 카운터(좋아요·조회수·댓글 수)는 클라이언트에서 `select` 후 `+1` 하지 않는다. **DB 안에서 단일 `update ... set n = n + 1`** 로 끝낸다.
- **중복 삽입 방지(같은 장소에 후기 1개)는 `unique` 제약 + `on conflict` 가 기본이다.** `select ... for update` 로는 못 막는다 — 아직 없는 행은 잠글 대상이 없어(팬텀) 두 트랜잭션이 동시에 "없음"을 보고 둘 다 insert 한다. 존재하지 않는 행을 막는 것은 제약뿐이다.
- **`for update` 는 이미 있는 부모 행을 잠글 때만 쓴다.** 크루 정원처럼 "기존 크루 행을 잠그고 현재 인원을 세어 자리가 있으면 자식 행을 넣는" 경우다. 잠글 부모 행이 실재하므로 팬텀 문제가 없다.
- 잠금이 필요한 로직은 **적용 전에 사용자와 상의**한다. 락 범위를 잘못 잡으면 교착이 난다.

### 3-3. 인덱스를 설계해야 할 때

**쿼리 형태가 RPC 안에 고정돼야 그 형태에 맞춰 인덱스를 짤 수 있다.** PostgREST 필터도 SQL 로 변환되므로 단일 컬럼 인덱스는 클라이언트 쿼리도 탄다 — 문제는 **임의 조합**이다. 필터·정렬 조합이 열려 있으면 특정 복합 인덱스로 고정할 수 없고, RPC 로 형태를 좁혀야 인덱스 설계와 검증이 가능해진다.

- 반경 검색처럼 인덱스가 성패를 가르는 것은 반드시 RPC (`nearby_places` 의 `ST_DWithin` + GIST).
- 복합 조건(카테고리 + 종 + 거리 + 상태)은 함수 하나로 받아 **인덱스 조합을 설계**한다 — 거리는 GiST, 등호 필터는 B-tree 로 타입이 갈리므로 단일 복합 인덱스로 단정하지 않는다. 함께 묶어야 하면 `btree_gist` 확장까지 검토하고, 최종 형태는 실행계획으로 정한다.
- **인덱스는 실측하고 넣는다.** `explain (analyze, buffers)` 로 실제로 타는지 확인한다 — 여기서 `analyze` 는 **실행·측정 옵션**이고, 통계 갱신은 별도 명령 `analyze public.species` 다. 주의: 통계가 잡히기 전에는 플래너가 기본 추정치로 판단해 **안 쓸 인덱스도 쓰는 것처럼 보인다**(`species` 에서 550행으로 추정한 것을 관찰 — 실제 14행). 작은 참조 테이블은 정렬조차 Seq Scan + Sort 가 이긴다 — 거기에 인덱스를 만들면 어드바이저에 `unused_index` 로만 남는다. ([ADR-0005](../adr/0005-species-code-system.md))

### 3-4. RPC 로 만들지 않는 것

단일 테이블의 단순 `select`/`insert` 는 그냥 `.from()` 으로 부른다. 위 세 조건에 걸리지 않는데 RPC 로 감싸면 **호출부와 DB 양쪽을 고쳐야 하는 비용만 늘어난다.**

### 3-5. RPC 작성 규칙

- `set search_path = ''` 를 붙이고 객체는 스키마까지 적는다(`public.places`). 안 그러면 search_path 조작에 열린다.
- 인자는 `p_` 접두사(`p_lat`, `p_radius_m`).
- **행위자를 인자로 받지 않는다.** `p_actor_user_id` 같은 신뢰 파라미터는 브라우저에서 위조된다. 항상 `auth.uid()` 로 DB 에서 잡는다.
- 반환이 `returns table (...)` 이면 타입이 전 컬럼 non-null 로 생성된다 — 소비 계층에서 nullability 를 복원한다(1절 참고).
- `security invoker`/`definer` 와 실행 권한 grant 는 **4절 보안 모델**을 따른다. `definer` 로 RLS 를 우회할 때는 함수 안에서 권한을 직접 검사한다.
- 적용 후에는 5절대로 `pg_proc`·`search_path`·`security` 설정과 실행 권한을 실제로 확인한다.

## 4. read/write 전략 — 전부 브라우저 client

우리 쪽 서버 런타임이 없으므로 read든 write든 **브라우저 client + TanStack Query**로 Supabase를 직접 호출한다.

- **read**: `useQuery`의 `queryFn`에서 `.rpc()`/`.from()` 직접 호출 → `use-query-*` 훅으로 감싼다.
- **write(mutation)**: `useMutation` → 성공 시 관련 `invalidateQueries`.
- 캐시 공유로 props drilling을 피하고, mutation 후 즉시 갱신한다.

### 보안 모델 (우리 쪽 검증 계층이 없기 때문에)

**RLS 2단 모델** — 정보 허브라 로그인 게이트를 두지 않는다. ([결정](../adr/0004-client-side-supabase-auth.md) 계열)

- **공개 콘텐츠 = 읽기 공개**: 장소·종·사전·성분·제품·커뮤니티 글·리뷰 등은 `anon`+`authenticated` SELECT 허용. 게스트도 열람한다. (초안 `dex_articles`는 `published`만 노출.)
- **개인정보·UGC = 본인만 쓰기**: profiles·pets·reviews·posts·comments 의 INSERT/UPDATE/DELETE 는 `authenticated` + RLS(`auth.uid() = user_id/owner_id/author_id`). 참조 데이터(장소·종·사전·성분)는 **쓰기 정책 없음**(=service_role/마이그레이션만).
- 권한 판단은 DB(RLS)가 한다. 정책의 `auth.uid()`는 **`(select auth.uid())`로 감싸** 플래너가 initPlan으로 캐시하게 한다(성능).
- **공개 데이터 RPC는 `SECURITY INVOKER`**로 두면 테이블 RLS(공개 읽기)가 그대로 적용돼 게스트도 호출 가능하다(예: `nearby_places`).
- **개인 데이터 RPC는 `authenticated`에만 grant하기 전에 `public`에서 `execute`를 먼저 회수한다.** PostgreSQL은 함수 생성 시 `public`에 `execute`를 기본 부여하고 `anon`이 이를 상속하므로, `authenticated`에만 grant해도 anon 실행이 막히지 않는다. 정확한 시그니처로 `revoke execute on function public.fn(arg_types) from public` 후 `grant execute ... to authenticated`. (실측 2026-07-23: grant 없이 함수만 만들어도 `has_function_privilege('anon', ...)` = true.)
- `p_actor_user_id` 같은 **신뢰 파라미터 패턴 금지** — 브라우저에서 다른 유저 id를 넣어 위조할 수 있다. 행위자는 항상 `auth.uid()`로 DB에서 잡는다.
- **RLS는 행 단위라 컬럼을 구분하지 못한다.** 사용자가 바꾸면 안 되는 컬럼(`reviews.is_verified` 같은 검증 플래그, `created_at`, 소유권 컬럼)은 RLS로 못 막으니 **컬럼 단위 grant**로 잠근다: 테이블 레벨 `insert, update`를 회수한 뒤 허용 컬럼만 화이트리스트로 `grant`. 테이블 레벨 grant가 남아 있으면 컬럼 제한은 무의미하다. 플래그 승격은 `service_role`(Edge Function)만.
- **트리거 전용 함수**(`handle_new_user`, `set_updated_at`)는 REST RPC로 노출될 필요가 없으니 `anon`·`authenticated`·`public`에서 `execute`를 회수한다(어드바이저 WARN 방지). `create or replace function`은 ACL을 보존하므로 함수 본문을 고쳐도 회수 상태는 유지된다.
- **DB 제약이 유일한 검증 계층이다.** 요청이 우리 코드를 거치지 않고 브라우저에서 Supabase로 바로 가므로, 클라이언트 Zod는 공개 anon key + REST 직접 호출로 우회된다. 길이 상한·좌표 범위·짝 일치는 반드시 `check` 제약으로 건다. 특히 좌표: **geography 캐스트는 범위 초과를 에러 없이 wrap**하므로(위도 91 → 89) 제약이 없으면 `lat/lng`와 생성컬럼 `geog`가 조용히 어긋난다.
- `service_role`/비밀키가 필요한 로직(Gemini 호출, 공공데이터 정제, 관리 작업)은 **Supabase Edge Function**으로 뺀다. 브라우저엔 절대 두지 않는다.

## 5. 변경 후 검증

- RPC·RLS·table·trigger·function이 바뀌면 MCP `execute_sql`로 원격 상태를 확인한다.
- RPC 변경 후: `pg_proc`, `search_path`, `security invoker/definer`, `authenticated` 실행 권한 확인.
- 제약 변경 후: `pg_constraint`에서 실제 적용 여부 확인.
- Advisor: 무료 플랜으로 못 고치는 `Leaked Password Protection Disabled`는 수정 대상으로 보지 않는다. Performance Advisor 경고는 남았는지 확인한다.
