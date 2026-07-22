# 아키텍처·SRP 컨벤션 (FSD)

레이어의 역할과 의존 방향은 각 `src/<layer>/README.md`에 있다. 이 문서는 **슬라이스 내부의 단일 책임**과 "이 코드 어디 두지?"를 다룬다.

> **PixelPlay와 다른 점**: 우리는 Static Export라 **우리가 돌리는 Next 서버 런타임이 없다**(백엔드는 Supabase). `actions/`(Server Actions), `proxy.ts`(라우트 가드), Server Component 데이터 페칭, `_data/` 폴더는 **쓰지 않는다.** mutation은 클라이언트에서 Supabase client로 한다. ([ADR-0002](../adr/0002-static-export.md), [ADR-0004](../adr/0004-client-side-supabase-auth.md))

## 슬라이스 구조 (세그먼트)

한 슬라이스(`features/write-post/`, `entities/place/` 등)는 필요한 세그먼트만 갖고 `index.ts`로 공개 API를 노출한다.

| 세그먼트 | 담는 것 |
|---|---|
| `ui/` | 컴포넌트 (렌더링만, 로직은 model/hook로) |
| `model/` | 타입, Zustand 스토어, 순수 로직 |
| `api/` | Supabase 접근 (query/mutation 훅, `.rpc()`/`.from()`) |
| `lib/` | 그 슬라이스 전용 순수 유틸 |

바깥에서는 `index.ts`가 노출한 것만 import한다. 슬라이스 내부 파일을 깊게 참조하지 않는다.

## 이 코드 어디 두지

| 대상 | 위치 |
|---|---|
| 화면 조립(라우트 1:1) | `views/<name>` |
| 독립 UI 블록 | `widgets/<name>` |
| 사용자 행동(폼·mutation) | `features/<name>/{ui,model,api}` |
| 도메인 모델·카드·조회 | `entities/<name>/{ui,model,api}` |
| shadcn 래퍼 | `shared/ui` |
| 외부 lib 설정(supabase client, cn, zod 스키마) | `shared/lib` |
| 상수·Query Key·앱 메시지 | `shared/config` |
| 앱 전역 Provider(Query·Theme·Toaster) | `shared/providers` — `app/`은 라우팅 껍데기라 조립 로직을 두지 않는다. `layout`은 `AppProviders` 하나만 감싼다 |
| 전역 스토어(auth 세션 등) | `shared` (슬라이스 전용 스토어는 그 슬라이스 `model`) |
| DB 자동 생성 타입 | `shared/lib/supabase/database.types.ts` |

## SRP 체크리스트

1. [ ] 컴포넌트에 Supabase 호출이 직접 있는가 → 슬라이스 `api/`(query/mutation 훅)로 이동
2. [ ] 컴포넌트에 복잡한 포맷팅·정규식이 있는가 → `lib`(순수 함수)로 이동
3. [ ] 한 컴포넌트가 폼 관리·데이터 페칭·렌더를 모두 하는가 → 훅/model로 로직 분리
4. [ ] 반복되는 상수가 하드코딩됐는가 → `shared/config`로 이동
