# 별별펫

> 별의별 반려동물이 다 여기에. 강아지·고양이부터 고슴도치·페럿·파충류까지, 종을 가리지 않는 반려 생활 통합 허브.

병원·미용·호텔 **지도**, 동네 **커뮤니티**, 반려동물 **사전**, 성분 **분석** — 흩어져 있던 것을 한곳에 모은다. 배포 대상은 **Capacitor WebView 앱**이고, 웹 빌드는 그 앱에 담길 화면 그 자체다 — 독립 웹사이트가 아니라 Toss식 웹뷰 앱이다.

## 이 프로젝트가 푼 문제들

기능 목록보다 **어떤 판단을 왜 했는지**가 이 저장소의 내용이다.

### 반려 정보는 종마다 흩어져 있고, 특수동물은 사막이다

강아지대통령은 개만, 고양이대통령은 고양이만 다룬다. 고슴도치·페럿·파충류를 키우는 사람은 "이 동네에서 우리 아이를 봐줄 병원이 어디인지"조차 커뮤니티를 뒤져야 안다.

별별펫은 **종을 데이터의 값으로 다룬다.** 강아지·고양이·특수동물이 별도 화면이 아니라 하나의 `pet`·`place` 모델 위에서 `species` 값으로 갈라진다. 그래서 "특수동물 진료 가능 병원" 같은 필터가 코드 복제 없이 자연스럽게 나온다. 이 태깅은 아무도 안 하는 차별점이다.

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

**"따뜻한 흙, 차분한 물"** — 고채도를 피한 흙빛 팔레트.

| 역할 | 색 | Light | Dark |
|---|---|---|---|
| Primary (CTA) | 테라코타 | `#D9673F` | `#E8825C` |
| Anchor (헤더·링크) | 딥틸 | `#2E5D5A` | `#4A8B85` |
| Background | 크림 | `#F7F2EC` | `#141210` |

터치 WebView 기준: hover 의존 금지, 최소 탭 영역 44×44px, 색상 단독 정보 전달 금지, Safe Area 준수, 본문 텍스트 선택 허용.

## 진행 상황

> PR을 올릴 때마다 갱신한다.

**M0 · 기반** — 진행 중

- [x] 라우터 설계 확정 + 라우트 스켈레톤 12화면 (`(tabs)`/`(full)` 그룹, 쿼리 라우트)
- [x] 코어 DB 스키마 — 테이블 13 · enum 6 · RLS 정책 27 · PostGIS 반경 RPC · TS 타입 동기화
- [x] 개발 기반 — CI(GitHub Actions), Vitest + Playwright, 컨벤션 7종, ADR 4건
- [ ] Providers 배선 (TanStack Query · next-themes · sonner)
- [ ] 데이터 계층 규약 (query key 팩토리 · `use-query-*` 훅 패턴)
- [ ] Capacitor 셋업 (Android 우선 — iOS는 macOS 필요)
- [ ] 디자인 토큰 폴리시 + shadcn 기본 세트
- [ ] species 시드 (특수동물 코어 세트)

**이후** — M1 셸 & 내비게이션 → M2 인증 & 프로필 → M3 지도 → M4 리뷰 → M5 커뮤니티 → M6 사전 & 성분

## 시작하기

```bash
npm install
npm run dev      # 개발 서버
npm run build    # out/ 에 정적 번들 생성
```

## 문서

- [CLAUDE.md](CLAUDE.md) — 작업 규칙과 제약
