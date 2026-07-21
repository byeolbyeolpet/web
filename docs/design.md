# 별별펫 설계 문서 (working spec)

> 이 파일은 이전 세션(구 폴더 `A to Z Animals\web`)에서 사용자와 논의·결정한 것을 새 세션으로 넘기는 인수인계 겸 설계 스펙이다. `CLAUDE.md`가 "규칙"이라면 이 문서는 "무엇을 왜 그렇게 만들기로 했나"의 상세다. 방향이 헷갈리면 `CLAUDE.md` → 이 문서 순으로 읽는다.

## 0. 지금 어디까지 왔나 (2026-07-21)

- 서비스명 **별별펫** 확정 (네이밍 3라운드, 앱스토어/펫업종/상표 충돌 검증 완료. .com은 WebView라 무관하다고 결론).
- 프로젝트 골격 세팅 완료: Next 16.2.10 + React 19 + Tailwind v4 + shadcn(radix-nova) + React Compiler, Static Export(`output:'export'`) 빌드 검증 통과, FSD 6레이어, 브랜드 토큰, 앱 아이콘, 첫 커밋(`ca6acf3`).
- **대기 중(사용자 작업)**: ① GitHub Organization `byeolbyeolpet` 생성 + 원격 연결, ② Supabase 새 org+프로젝트 생성.
- **다음(Claude 작업)**: 라우터 구조 파일화 → Supabase 스키마 SQL 파일화 → 홈/지도/커뮤니티 목업.

## 1. 정체성 (재확인)

- 핵심 차별점 = **전(全) 반려동물, 특히 특수동물**(고슴도치·페럿·파충류). 강아지대통령/고양이대통령은 단일 종. 우리는 종을 안 가린다.
- **특수동물 진료 가능 병원 태깅 = 해자.** 아무도 안 한다.
- 가치 = **정보의 퍼짐(scattered) 해소.** 병원·미용·호텔 지도 + 동네 커뮤니티 + 사전 + 성분분석을 한곳에.
- **위치/동네는 기능이지 정체성이 아니다.** (사용자 교정 사항: 지도를 정체성으로 착각 금지.)
- 대상: 20~40대 반려인. 배포: 웹(Vercel) → Capacitor WebView 앱(방식 B: 화면 앱 내장 + OTA 업데이트. 방식 A 원격 URL은 심사 반려 리스크라 배제).

## 2. IA — "나무 말고 숲" (사용자 핵심 피드백으로 정리)

기능 15개를 개별로 두지 않고 **행동 단위로 접었다.**

- **산책크루·실종찾기·입양·자유글**은 전부 "커뮤니티 글"이다 → `posts` 하나에 `category`로 가른다. 별도 기능 아님.
- 주소를 등록하니 **당근마켓처럼 동네 기반**으로 커뮤니티가 굴러간다.
- 표시 방식: **실종·입양은 지도**, 나머지 커뮤니티는 **피드**.
- 카테고리는 **멀티 선택 필터**로 준다(단일 라디오 아님).

### 최상위 4 액션 (Bottom Nav 후보)

1. **지도** — 병원·미용·호텔 + 실종·입양(공공데이터 장소원장 + 핀). 종/특수동물 필터.
2. **커뮤니티** — 동네 기반 피드(산책크루·자유·질문 등 category 멀티필터).
3. **홈(대시보드)** — 진입점. 성분분석 등으로 유도하는 카드형 UX.
4. **프로필/마이** — 내 펫, 내 글, 설정.

- **성분분석**: Shop에 묶지 말고 별도 진입(전용 검색 페이지). 홈에서 카드로 유도.
- **반려동물 사전**: 사이드바 진입(탭 아님).
- **Shop**: 지금은 계획 없음 → **Tutorial/준비중 페이지**로만 남긴다(추후 입점 기준).
- **헤더**: 좌측 프로필 / 가운데 로고 / 우측 사이드바 토글 (디자인 단계에서 확정, 확정 아님).

## 3. 라우터 구조 (route groups)

Static Export이므로 동적 라우트는 전부 `generateStaticParams` 필수, 개인화는 클라이언트에서 Supabase Auth로.

```
src/app/
├── (tabs)/                 # Bottom Nav 유지되는 화면들
│   ├── layout.tsx          # BottomNav + 헤더 공통 셸
│   ├── page.tsx            # 홈 대시보드  (/)
│   ├── map/page.tsx        # 지도        (/map)
│   ├── community/page.tsx  # 커뮤니티 피드 (/community)
│   └── me/page.tsx         # 마이        (/me)
├── (full)/                 # 전체화면 (Bottom Nav 숨김, 뒤로가기 중심)
│   ├── layout.tsx
│   ├── place/[id]/page.tsx     # 장소 상세  (generateStaticParams)
│   ├── post/[id]/page.tsx      # 글 상세
│   ├── post/new/page.tsx       # 글 작성
│   ├── ingredient/page.tsx     # 성분 분석 검색
│   ├── dex/page.tsx            # 사전 목록 (사이드바 진입)
│   ├── dex/[slug]/page.tsx     # 사전 상세 (SSG, SEO 핵심)
│   └── shop/page.tsx           # 준비중(Tutorial)
├── login/page.tsx
└── layout.tsx              # RootLayout (폰트/메타/테마)
```

- **`(tabs)` vs `(full)` 결정 근거**: 탭 4개는 앱의 상시 목적지라 Bottom Nav를 유지한다. 상세/작성/검색 같은 "파고드는" 화면은 전체화면 + 뒤로가기가 자연스럽다(모바일 앱 관례). full = "페이지 자체"로 몰입, 뒤로가기로 복귀.
- Bottom Nav는 **헤더가 아니라 하단**에 둔다(사용자 용어 정정: 탭바 = BottomNavBar). full 화면에서도 NavBar를 유지하는 앱이 많은지 비교 필요했고, 상세로 들어갈 땐 숨기는 쪽으로 정리.
- URL에 종/카테고리를 넣지 않는다. slug/id 고유 → 종 추가돼도 URL 불변. 필터는 쿼리스트링.

## 4. 데이터 스키마 (Supabase Postgres + PostGIS)

> "그릇(필드)은 초장에 만든다. 기능은 미뤄도 컬럼은 미리." — 사용자 원칙. 나중에 ALTER보다 싸다.

### 핵심 테이블

- **species** — 종 마스터(강아지/고양이/고슴도치/페럿/파충류...). 특수동물 여부 플래그.
- **breeds** — 품종. species에 2-tier(종→품종)로 매단다.
- **profiles** — 사용자(= auth.users 1:1). 동네(주소/좌표) 보유 → 당근식 동네 기반.
- **pets** — 내 반려동물(species/breed FK, 프로필 소유).
- **places** — 장소 원장. `geography(POINT)` + **GIST 인덱스**. 공공데이터로 시딩(행안부 LOCALDATA, 검역본부). 좌표 EPSG:5174→WGS84 변환.
- **place_species** (N:N) — **해자.** "이 장소가 진료 가능한 종". 특수동물 필터의 핵심.
- **reviews** — 자체 UGC. 영수증 인증(핏펫 패턴). `visited_species_id`(어떤 종으로 방문했나), `search_tsv`(tsvector + GIN, 리뷰 검색용 — 지금은 필드만, 검색기능은 후순위).
- **posts** — 커뮤니티 글. `category`(산책크루/실종/입양/자유/질문...), `location`(동네 기반), 실종·입양은 지도 표시용 좌표.
- **comments** — posts 하위.
- **dex_articles** — 사전 콘텐츠. 빌드 시 SSG(SEO). 위키/공공 팩트 소스, 표현은 재작성.
- **products / ingredients** — 성분 분석. products ↔ ingredients N:N.
- **market_leads** — Shop 준비 단계 수요 수집용(선택).

### 반경+필터 복합 쿼리

- `nearby_places` **RPC**: `ST_DWithin`으로 "내 위치 5km 이내" + place_species 조인으로 "특수동물 진료 가능" 필터를 **한 쿼리에서**. → Firestore가 아니라 Supabase를 택한 결정적 이유(Firestore는 geohash 수동).
- 개인화 권한은 **RLS**(`auth.uid() = user_id`)로 DB에서 끝낸다.

## 5. 지도 데이터 3층 (약관 방어)

| 층 | 출처 | 저장 |
|---|---|---|
| 렌더링 | 카카오맵 SDK | ✗ 표시만 (좌표·리뷰 저장 금지 = 약관) |
| 장소 원장 | 공공데이터(행안부/검역본부, 이용허락 제한 없음) | ✓ 우리 DB |
| 리뷰 | 자체 UGC(영수증 인증) | ✓ 우리 DB |

카카오맵/구글맵의 장소·평점·좌표를 우리 DB에 저장/재사용하면 약관 위반. 그래서 공공데이터로 원장을 채우고 리뷰는 자체 생성한다.

## 6. 서버 로직 위치

Static Export라 서버가 없다. 서버가 필요한 것(Gemini 호출, 비밀키 쓰는 외부 API, 공공데이터 정제 파이프라인 등)은 전부 **Supabase Edge Functions**. 웹과 앱이 같은 엔드포인트를 쓴다.

## 7. 컬러 (확정)

| 역할 | 색 | Light | Dark |
|---|---|---|---|
| Primary (CTA) | 테라코타 | `#D9673F` | `#E8825C` |
| Anchor (헤더·링크·선택탭) | 딥틸 | `#2E5D5A` | `#4A8B85` |
| Background | 크림 | `#F7F2EC` | `#141210` |
| Surface(card) | | `#FFFFFF` | `#1E1B19` |
| Text | | `#1A1512` | `#F5F0EA` |

고채도 회피, 다크모드 채도 보정(+5~15%). 토큰은 `src/app/globals.css`. `--anchor` 커스텀 토큰 추가됨(`bg-anchor`/`text-anchor`).

## 8. 다음 작업 순서 (새 세션이 이어받을 것)

1. `(tabs)`/`(full)` route group + 각 page 뼈대 생성 (위 §3 구조대로).
2. Supabase 스키마 SQL을 `supabase/migrations/`에 파일화 (§4). PostGIS 확장 활성화, GIST/GIN 인덱스, `nearby_places` RPC, RLS 정책.
3. 홈 대시보드 / 지도 / 커뮤니티 피드 목업 (widgets: header, bottom-nav, sidebar, place-map).
4. shared/lib/supabase 클라이언트 세팅(`.env.example`에 키 자리).

## 9. 사용자 확정 원칙·피드백 (놓치지 말 것)

- "나무만 보지 말고 숲을 보렴" — 기능을 개별로 나누지 말고 행동/데이터로 묶어라.
- "그릇은 초장에 만들어라" — 스키마 필드를 기능보다 먼저. 빼지 마라.
- "앱으로 출시할 건데 왜 자꾸 웹 우선이냐" — 처음부터 앱(WebView) 고려가 기본값.
- ".com이 뭐가 중요해, WebView인데" — 도메인 선점은 판단 기준 아님. 앱스토어 동명만 본다.
- 비관/방어적 태도 경계 — 시장조사로 죽인 이전 프로젝트(아동 도감, 산모앱) 트라우마로 과하게 몸사리지 말 것. 펫앱은 데이터 주인 없고 밀려날 일 없어 성립한다고 결론남.
