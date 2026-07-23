# 별별펫

> 별의별 반려동물이 다 여기에. 강아지·고양이부터 고슴도치·페럿·파충류까지, 종을 가리지 않는 반려 생활 통합 허브.

병원·미용·호텔 **지도**, 동네 **커뮤니티**, 반려동물 **사전**, 성분 **분석** — 흩어져 있던 것을 한곳에 모은다. 배포 대상은 **Capacitor WebView 앱**이고, 웹 빌드는 그 앱에 담길 화면 그 자체다 — 독립 웹사이트가 아니라 Toss식 웹뷰 앱이다.

## 이 프로젝트가 푼 문제들

기능 목록보다 **어떤 판단을 왜 했는지**가 이 저장소의 내용이다.

### 반려 정보는 종마다 흩어져 있고, 특수동물은 사막이다

강아지대통령은 개만, 고양이대통령은 고양이만 다룬다. 고슴도치·페럿·파충류를 키우는 사람은 "이 동네에서 우리 아이를 봐줄 병원이 어디인지"조차 커뮤니티를 뒤져야 안다.

별별펫은 **종을 데이터의 값으로 다룬다.** 강아지·고양이·특수동물이 별도 화면이 아니라 하나의 `pet`·`place` 모델 위에서 `species` 값으로 갈라진다. 그래서 "특수동물 진료 가능 병원" 같은 필터가 코드 복제 없이 자연스럽게 나온다. 이 태깅은 아무도 안 하는 차별점이다.

종을 어디까지 쪼갤지는 **"이 종을 진료할 수 있는 병원이 실제로 갈리는가"**로 정했다. 뱀은 못 보는 병원이 많아 `snake` 를 독립시켰고, 앵무·문조는 같은 병원이 보니 `bird` 하나로 묶고 품종은 `breeds` 로 내렸다. 반대로 햄스터·기니피그·친칠라는 같은 병원이 보더라도 **사용자 인식이 달라** 쪼갰다 — "우리 기니피그 봐주는 병원"이 검색돼야 차별점이 실체가 된다. ([ADR-0005](docs/adr/0005-species-code-system.md))

### Static Export를 배포 타깃으로 고정했다

최종 형태가 Capacitor WebView 앱이고, 앱은 정적 번들이 필수다. 그래서 `output: 'export'`를 켜고 그 대가를 받아들였다 — Server Actions, 요청 기반 Route Handler, 쿠키, ISR을 못 쓴다.

**서버가 필요한 일(외부 API 호출, 비밀키)은 전부 Supabase Edge Functions로 밀어냈다.** 웹과 앱이 같은 엔드포인트를 쓰게 된다. Next.js 16의 Cache Components(`use cache`)는 매력적이지만 Static Export를 지원하지 않아 평가 후 배제했다.

### 지도 데이터는 "표시"와 "저장"을 분리했다

카카오맵·구글맵은 SDK로 지도를 **그리는** 것은 허용하지만 그들의 장소·리뷰·좌표를 우리 DB에 **저장·재사용**하는 것은 약관 위반이다. 그래서 3층으로 나눴다.

| 층 | 출처 | 저장 |
|---|---|---|
| 렌더링 | 카카오맵 SDK | ✗ 표시만 |
| 장소 원장 | 공공데이터(행안부 LOCALDATA, 검역본부) | ✓ 우리 DB |
| 리뷰 | 자체 UGC (영수증 인증) | ✓ 우리 DB |

공공데이터는 이용허락 제한이 없어 저장·가공이 자유롭다. 좌표는 EPSG:5174 → WGS84로 변환해 넣는다.

### Supabase를 고른 이유는 PostGIS다

"내 주변 5km + 특수동물 진료 가능" 같은 **반경 + 필터 복합 쿼리**를 Firestore로 하려면 geohash를 수동으로 굴려야 한다. PostGIS는 `ST_DWithin` 한 줄이고 GIST 인덱스가 받쳐준다. RLS로 개인화 권한까지 DB에서 끝난다.

## 아키텍처

**Feature-Sliced Design.** 의존은 단방향이다: `app → views → widgets → features → entities → shared`.

```
src/
├── app/        Next.js 라우팅 껍데기
├── views/      화면 (FSD의 pages. Next와 이름 충돌을 피해 개명)
├── widgets/    독립적 UI 블록 (header, bottom-nav, sidebar, place-map)
├── features/   사용자 행동 (auth, write-post, review-place, search-ingredient)
├── entities/   도메인 모델 (pet, place, post, review, user, species)
└── shared/     ui(shadcn), lib(cn, supabase), config
```

종(강아지/고양이/특수동물)도, 커뮤니티 글 종류(산책크루/실종/입양/자유)도 폴더로 쪼개지 않는다. 코드의 차이가 아니라 **데이터의 값**이라 discriminated union으로 타입만 갈라진다.

## 기술 스택

| | |
|---|---|
| 프레임워크 | Next.js 16 (App Router, React Compiler, Static Export) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4, shadcn/ui |
| 데이터·인증 | Supabase (Postgres + PostGIS, Auth, Storage, Edge Functions) |
| 지도 | 카카오맵 SDK (표시) + 공공데이터 (장소 원장) |
| AI | Google Gemini (Edge Function 경유) |
| 배포 | Capacitor WebView 앱 (앱-only, 웹 빌드=앱 화면 substrate) |

## 디자인 시스템

**크롬은 비우고, 색은 아껴 쓴다.** 헤더에 색을 칠하지 않는다 — 화면의 주인공은 펫 사진과 정보다. 위계는 색이 아니라 타이포와 여백이 만든다.

| 역할 | Light | Dark |
|---|---|---|
| Primary — CTA·활성 탭 | `#6E56CF` | `#9B87F5` |
| Primary tint — 종 태그(해자) | `#EFEBFB` | `#241C3D` |
| Background | `#FFFFFF` | `#0D0D0F` |
| Text | `#111318` | `#F4F4F6` |

바이올렛을 고른 이유는 **정보를 정리해주는 도구**의 색이기 때문이다. 펫 앱들이 대부분 따뜻한 색으로 감정을 노리는 반면, 우리 정체성은 "흩어진 걸 한곳에"다. 크롬이 무채색이라 브랜드 색이 나오는 면적이 작고, 면적이 작을수록 평범한 색은 아예 기억에 남지 않는다.

색은 세 층으로 쓴다 — **브랜드**(CTA·활성 탭), **정보**(상태 구분, 아이콘 병행 필수), **중립**(그 외 전부). 종 태그만은 중립이 아니라 브랜드 tint로 올린다. 특수동물 진료 태깅이 차별점인데 회색으로 죽이면 그게 안 보인다.

터치 WebView 기준: hover 의존 금지, 최소 탭 영역 44×44px, 색상 단독 정보 전달 금지, Safe Area 준수, 본문 텍스트 선택 허용.

shadcn 을 얹을 때 이 규칙이 바로 걸렸다. `radix-nova` 스타일은 데스크톱 밀도라 기본 버튼이 32px, 다이얼로그 닫기 버튼이 27px 로 들어온다. 브라우저에서 실측해 확인하고 **사이즈 스케일을 sm 44 / default 48 / lg 56 으로 올렸으며, 44px 를 만들 수 없는 `xs`·`icon-xs` 는 삭제했다** — 못 누르는 사이즈를 API 에 남겨두면 결국 쓰인다. 대비도 함께 실측해 라이트/다크 양쪽에서 WCAG AA 를 넘는 것을 확인했다(종 태그 8.01/8.69, 기본 버튼 5.39/6.21).

## 진행 상황

> PR을 올릴 때마다 갱신한다.

**M0 · 기반** — 진행 중

- [x] 라우터 설계 확정 + 라우트 스켈레톤 12화면 (`(tabs)`/`(full)` 그룹, 쿼리 라우트)
- [x] 코어 DB 스키마 — 테이블 13 · enum 6 · RLS 정책 27 · PostGIS 반경 RPC · TS 타입 동기화
- [x] 개발 기반 — CI(GitHub Actions), Vitest + Playwright, 컨벤션 7종, ADR 4건
- [x] Providers 배선 — TanStack Query · next-themes(다크모드) · sonner
- [x] 데이터 계층 규약 — Query Key 팩토리 + 기준 훅(`entities/species`)
- [x] Capacitor 셋업 — Android 앱으로 실구동 확인 (iOS는 macOS 필요, 별도)
- [x] 디자인 토큰 — 무채색 크롬 + 바이올렛 단일 브랜드, 한글 타이포 기준
- [x] shadcn 기본 세트 7종 — 터치 44px 스케일로 재조정, 대비 실측 검증
- [x] species 시드 — 종 코드 체계 확정([ADR-0005](docs/adr/0005-species-code-system.md)) + 14종

**이후** — M1 셸 & 내비게이션 → M2 인증 & 프로필 → M3 지도 → M4 리뷰 → M5 커뮤니티 → M6 사전 & 성분

## 시작하기

```bash
npm install
npm run dev      # 개발 서버
npm run build    # out/ 에 정적 번들 생성
```

### 앱으로 실행하기

웹 빌드 산출물(`out/`)이 그대로 네이티브 WebView 안에 담긴다. UI 를 다시 짜지 않는다.

```bash
npm run app:android   # build → cap sync → Android Studio 열기
npm run app:sync      # build → cap sync (에뮬레이터를 열지 않을 때)
```

`android/` 는 Capacitor 가 생성한 네이티브 프로젝트다. 아이콘·권한·스플래시를 직접 수정하는 곳이라 저장소에 포함하며, 그 안의 `app/src/main/assets/public` 만은 `out/` 의 복사본이라 추적하지 않는다(`cap sync` 가 매번 다시 만든다).

**필요한 것**: [Android Studio](https://developer.android.com/studio) (JDK 를 함께 설치해 준다). iOS 는 Xcode 가 필요해 macOS 에서만 빌드할 수 있다.

## 문서

- [CLAUDE.md](CLAUDE.md) — 작업 규칙과 제약
