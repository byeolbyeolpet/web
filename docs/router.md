# 라우터 설계 (Router Design)

- 날짜: 2026-07-21
- 상태: 확정
- 전제: [ADR-0001](adr/0001-app-only-webview-delivery.md) 앱-only · [ADR-0002](adr/0002-static-export.md) Static Export · [ADR-0004](adr/0004-client-side-supabase-auth.md) 클라이언트 Supabase Auth

App Router를 **두 개의 route group**으로 가른다. `app/`은 얇은 라우팅 껍데기이고, 각 `page.tsx`는 `views/*`(FSD의 화면)를 불러 렌더만 위임한다.

## 1. 두 그룹: `(tabs)` vs `(full)`

| 그룹 | BottomNav | 성격 | 근거 |
|---|---|---|---|
| `(tabs)` | 유지 | 앱의 **상시 목적지 4개** | 언제든 탭으로 이동하는 홈 베이스 |
| `(full)` | 숨김 | **파고드는 화면**(상세·작성·검색), 뒤로가기 중심 | 몰입 후 뒤로가기로 복귀하는 모바일 앱 관례 |

두 그룹 모두 RootLayout(`app/layout.tsx`, 폰트/테마/메타) 아래 중첩된다. `(tabs)/layout.tsx`가 헤더 + BottomNav 셸을, `(full)/layout.tsx`가 뒤로가기 헤더를 담당한다.

## 2. 라우트 트리

```
src/app/
├── layout.tsx                 # RootLayout (폰트/테마/메타)
├── (tabs)/                    # BottomNav 유지
│   ├── layout.tsx             # 헤더 + BottomNav 셸
│   ├── page.tsx               # 홈 대시보드        (/)          → views/home
│   ├── map/page.tsx           # 지도              (/map)       → views/map
│   ├── community/page.tsx     # 커뮤니티 피드       (/community) → views/community
│   └── me/page.tsx            # 마이              (/me)        → views/me
├── (full)/                    # BottomNav 숨김, 뒤로가기 중심
│   ├── layout.tsx
│   ├── place/page.tsx         # 장소 상세  /place?id=   ← 클라 fetch
│   ├── post/page.tsx          # 글 상세    /post?id=    ← 클라 fetch
│   ├── post/new/page.tsx      # 글 작성    /post/new
│   ├── ingredient/page.tsx    # 성분 분석 검색 /ingredient
│   ├── dex/page.tsx           # 사전 목록  /dex
│   ├── dex/[slug]/page.tsx    # 사전 상세  /dex/:slug   ← 빌드 SSG
│   └── shop/page.tsx          # 준비중(Tutorial) /shop
└── login/page.tsx             # 로그인     /login
```

## 3. 라우트별 렌더링 전략 (Static Export 하에서)

| 라우트 | 세그먼트 | 렌더링 | 데이터 |
|---|---|---|---|
| `/`, `/map`, `/community`, `/me` | 정적 | 정적 셸 프리렌더 | 클라 개인화(세션) + 클라 fetch |
| `/place?id=` | 정적(쿼리) | 정적 셸 | 클라 fetch (TanStack Query) |
| `/post?id=` | 정적(쿼리) | 정적 셸 | 클라 fetch |
| `/post/new`, `/ingredient`, `/dex`, `/shop` | 정적 | 정적 프리렌더 | 클라 fetch(필요 시) |
| `/dex/[slug]` | **동적** | **빌드 SSG** (`generateStaticParams`) | 빌드 시점에 콘텐츠 구움 |
| `/login` | 정적 | 정적 | 클라 OAuth |

## 4. 왜 place/post는 `[id]`가 아니라 쿼리파라미터인가

Static Export는 동적 세그먼트 `[id]`에 대해 `generateStaticParams()`를 **필수**로 요구하고, `dynamicParams: true`의 런타임 fallback은 **지원되지 않는다** → **`generateStaticParams()`가 만들지 않은 경로는 404.** 번들이 정적 파일이라 런타임에 새 페이지를 찍어낼 Next 서버가 없다(데이터는 앱에서 Supabase로 직접 가져온다).

- **post**: 런타임에 계속 생성되는 UGC → 빌드 후 만든 글은 애초에 프리렌더 불가.
- **place**: 공공데이터라 빌드 때 존재는 하지만, 수만 개로 늘고 **리뷰가 live**라 프리렌더해도 빈 껍데기 + 새 장소마다 재빌드 필요 → 실익 없음.

그래서 둘 다 **정적 페이지 1장 + 쿼리스트링으로 id 전달 + 클라이언트 fetch**로 간다. 앱에선 URL을 사용자가 보거나 타이핑하지 않으니 쿼리파라미터의 미관 단점이 없고, 딥링크(`앱스킴://place?id=123`)도 정상 동작한다.

```
place/page.tsx → useSearchParams()로 id 취득 → useQuery(['place', id], fetchPlace)
```

`useSearchParams()`는 **Suspense 경계 안에 둔다.** 없으면 빌드가 `missing-suspense-with-csr-bailout`으로 멈춘다. (`window.location.search`를 effect에서 읽는 우회는 쓰지 않는다 — React Compiler 린트 `react-hooks/set-state-in-effect`에 걸린다.) 실물은 `views/pet-edit`.

`/pet/edit`도 같은 이유로 쿼리파라미터다. 펫은 사용자가 런타임에 만드는 것이라 빌드 시점에 id를 알 수 없다.

## 4-1. `next/link`의 prefetch는 끈다 (`prefetch={false}`)

**Static Export + App Router에서 세그먼트 prefetch가 동작하지 않는다.** 클라이언트가 요청하는 파일명에 세그먼트가 한 번 더 붙어 빌드 산출물과 어긋난다:

```
빌드 산출: out/me/__next.!KHRhYnMp.txt
클라 요청:    /me/__next.!KHRhYnMp.me.txt     ← `.me` 가 덧붙음 → 404
```

App Router 전 라우트에 해당한다(Next 문서의 "Prefetching with next/link 지원"은 `<PagesOnly>` 절이다). 실측: 마이 화면 진입 한 번에 **404가 14건** — 하단 탭 4개 + 펫 행 수만큼. 얻는 것 없이 요청만 나가므로 모든 `<Link>`에 `prefetch={false}`를 건다. 끄고 재측정한 결과 404는 0건.

번들이 기기 안에 통째로 들어 있는 WebView 앱이라 prefetch로 아낄 지연 자체가 없다 — 고쳐지더라도 켤 이유가 약하다.

## 5. dex만 SSG인 이유

사전은 **유한·큐레이션·잘 안 바뀌는 참조 콘텐츠**다. 빌드 때 HTML로 구워 앱에 내장하면 **네트워크 없이 즉시 열람**(지하철·엘리베이터)이 된다. 콘텐츠 갱신은 재빌드 + OTA로 처리한다. (근거는 오프라인/즉시표시이지 SEO가 아니다 — [ADR-0001].) 콘텐츠 소스(Supabase 빌드타임 fetch vs 리포 MDX)는 데이터 계층 설계에서 확정한다.

## 6. URL 원칙

- **URL에 종/카테고리를 넣지 않는다.** slug/id만 고유. 종(강아지→특수동물)이 추가돼도 URL은 불변.
- 필터는 **쿼리스트링**으로: `/map?species=reptile`, `/community?category=lost,adopt`(멀티 선택).

## 7. 인증 가드

서버 미들웨어가 없으므로([ADR-0004]) **가드는 클라이언트에서** 한다. 로그인 필요 화면(`/post/new`, `/me`, 리뷰 작성 등)은 클라 세션 확인 후 미인증이면 `/login`으로 리다이렉트한다. 첫 렌더에 세션 미확정 구간이 있으므로 로딩 처리를 둔다.

## 8. 후속 (구현 단계에서)

- `loading.tsx` / `error.tsx` 바운더리 배치 (그룹별/라우트별).
- place/post 상세의 앱 딥링크 스킴 매핑.
- `not-found` 처리(잘못된 id/slug).
