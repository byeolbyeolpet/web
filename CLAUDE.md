@AGENTS.md

# 별별펫 (byeolbyeolpet)

**별의별 반려동물이 다 여기에.** 강아지·고양이부터 고슴도치·페럿·파충류(특수동물)까지 종을 가리지 않는 **반려 생활 통합 허브**. 병원·미용·호텔 지도 + 동네 커뮤니티 + 반려동물 사전 + 성분 분석을 한곳에 모은다.

배포 대상은 **Capacitor WebView 앱 하나(앱-only)**. web 빌드(Static Export)는 그 앱에 담길 **화면 substrate**일 뿐 독립 사이트가 아니다 — Toss식 웹뷰 앱의 번들 변형. 그래서 **SEO·도메인은 관심사가 아니다.** 대상 사용자는 20~40대 반려인. (근거: [docs/adr/0001](docs/adr/0001-app-only-webview-delivery.md))

## 이 프로젝트의 목표

**프론트엔드 취업 포트폴리오다.** 우선순위는:

1. 코드 품질, 아키텍처, 성능, 접근성 — 채용하는 쪽이 보는 것
2. **판단을 문서로 남기기** — "만들었다"가 아니라 "이 문제를 이렇게 풀었다"
3. 기능의 양은 후순위

기능을 더 만드는 것보다 있는 것을 제대로 만드는 쪽을 택한다.

## 정체성 — 헷갈리면 여기로 돌아온다

- **핵심 차별점은 "전(全) 반려동물", 특히 특수동물이다.** 강아지대통령은 개만, 고양이대통령은 고양이만 다룬다. 우리는 종을 안 가린다. 특수동물 진료 가능 병원 태깅은 아무도 안 하는 해자다.
- **위치/동네는 기능이지 정체성이 아니다.** 지도를 정체성으로 착각하지 않는다. 정체성은 "종을 안 가리는 정보 통합"이다.
- 정보의 퍼짐(scattered)을 푸는 게 가치다. 흩어진 걸 한곳에.

## 역할

사용자와 Claude 단둘이 진행한다. Claude가 **기획·디자인·개발 전부** 담당한다. 끝까지 직접 만든다.

문서는 두 갈래. **사용자가 읽을 것은 HTML**(브라우저로 봄), **Claude가 볼 규칙은 .md**.

## 컨벤션 문서 (상세 규칙)

작업 유형별 상세 규칙은 `docs/conventions/`에 있다. 해당 작업을 하기 전에 관련 문서를 읽는다.

- [code](docs/conventions/code-convention.md) — 네이밍·파일명·훅·Query Key
- [srp](docs/conventions/srp-convention.md) — FSD 슬라이스/세그먼트·단일 책임
- [supabase](docs/conventions/supabase-convention.md) — 타입·마이그레이션·클라이언트 read/write·RLS
- [design](docs/conventions/design-convention.md) — 토큰·cn·모바일 우선·shadcn·Dialog
- [app-message](docs/conventions/app-message-convention.md) — 사용자 문구(APP_MESSAGE/FORM_MESSAGE)
- [validation](docs/conventions/validation-convention.md) — 검증 순서·권한·실패 보고
- [git](docs/conventions/git-convention.md) — 커밋·브랜치·PR·저자 규칙

## 아키텍처 — FSD

```
src/
├── app/        Next.js 라우팅 껍데기 (얇게)
├── views/      화면 (FSD의 pages. Next와 이름 충돌 회피)
├── widgets/    독립적 UI 블록 (header, bottom-nav, sidebar, place-map)
├── features/   사용자 행동 (auth, write-post, review-place, search-ingredient)
├── entities/   도메인 모델 (pet, place, post, review, user, species)
└── shared/     ui(shadcn), lib(cn, supabase), config
```

**의존은 단방향**: `app → views → widgets → features → entities → shared`. 역방향 참조 금지. "이 파일 어디 두지?"가 애매하면 의존 방향으로 판단한다.

**동물 종(강아지/고양이/특수동물)을 폴더로 쪼개지 않는다.** `entities/pet` 하나다. 종은 코드의 차이가 아니라 데이터의 값이고, discriminated union으로 타입만 갈라진다. 쪼개면 카드·상세·쿼리가 복제된다. **커뮤니티 글의 종류(산책크루/실종/입양/자유)도 마찬가지 — 전부 `post` 하나에 category 값으로 가른다.**

## 절대 어기면 안 되는 제약 — Static Export 경로

최종 타깃이 WebView 앱(Capacitor)이고 앱은 정적 번들이 필수다. `next.config.ts`에 `output: 'export'`가 켜져 있다. 아래를 어기면 앱 경로가 막힌다.

1. **`use cache` / `cacheComponents`를 쓰지 않는다.** Static Export를 지원하지 않는다.
2. **서버 로직을 Route Handler(요청 기반)나 Server Action에 두지 않는다.** Static Export엔 **우리가 돌리는 Next 서버 런타임이 없다** — 백엔드가 없다는 뜻이 아니라 **백엔드가 Supabase**라는 뜻이다. 서버에서 돌아야 하는 것(Gemini 호출, 비밀키를 쓰는 외부 API)은 전부 **Supabase Edge Functions**로 간다. 웹과 앱이 같은 엔드포인트를 쓴다.
3. **`next/image` 기본 최적화는 서버를 요구한다.** `images: { unoptimized: true }`로 꺼 뒀다. 이미지 서빙은 Supabase Storage 경로 참조로 간다.
4. **쿠키/proxy/redirects/rewrites/ISR 불가.** 개인화는 클라이언트에서 Supabase Auth 세션으로 처리한다.

## Next.js 16 — 내 지식과 다르다

**코드 쓰기 전에 `node_modules/next/dist/docs/`의 해당 가이드를 읽는다.** 확인된 차이:

- `params`가 **Promise**다. `await props.params`.
- **`PageProps<'/place/[id]'>`, `LayoutProps<'/'>` 전역 타입 헬퍼.** import 불필요. `next dev`/`next build`/`next typegen`이 생성한다.
- 미들웨어가 **`proxy`**로 바뀌었다 — 단 Static Export에선 못 쓴다.
- `reactCompiler: true`가 켜져 있다. 수동 `useMemo`/`useCallback`을 남발하지 않는다.
- 정적/동적 경계를 컴포넌트 단위로 내리는 Cache Components는 **위 제약 때문에 쓰지 않는다.** `generateStaticParams` + 클라이언트 개인화로 간다.
- Google Fonts는 CJK를 unicode-range로 서빙한다. `korean` subset은 없다. next/font의 `subsets`는 preload 대상만 정하므로 `subsets: ['latin']`이어도 한글은 렌더링된다.

## 데이터 — Supabase

- **DB: Supabase Postgres.** 지도 반경 쿼리는 **PostGIS**(`geography(POINT)`, GIST 인덱스, `ST_DWithin`), 개인화는 **RLS**(`auth.uid() = user_id`), 인증은 **Supabase Auth**(kakao/google OAuth).
- **장소 원장은 공공데이터로 채운다.** 행정안전부 LOCALDATA(동물병원/미용/위탁), 농림축산검역본부 영업장. 좌표는 EPSG:5174→WGS84 변환 필요. 이용허락 제한 없음.
- **카카오맵/구글맵의 리뷰·평점·좌표를 우리 DB에 저장/재사용하지 않는다(약관 위반).** 카카오맵 SDK는 **표시(렌더링) 용도로만** 쓴다. 리뷰는 자체 UGC(영수증 인증 방식, 핏펫 패턴).
- **수집·정제 데이터는 Git에 올리지 않는다.** 퍼블릭 저장소라 그대로 복사된다. 타입 정의와 샘플만 공개. 완성 데이터셋은 Supabase에.
- **스키마의 그릇(필드)은 미리 만든다.** 기능은 미뤄도 필드는 초장에 잡는다(예: `reviews.search_tsv` tsvector). 나중에 컬럼 추가보다 싸다.

## 디자인 시스템

`src/app/globals.css`에 토큰이 있다. **HEX 하드코딩 금지** — `bg-primary`, `text-muted-foreground` 같은 시맨틱 클래스를 쓴다.

**크롬은 무채색으로 비운다. 브랜드 색은 CTA·활성 탭·종 태그에만 등장한다.** 헤더에 색을 칠하지 않는다 — 화면의 주인공은 펫 사진과 정보이고, 배경이 조용해야 사진이 산다. 위계는 색이 아니라 **타이포와 여백**이 만든다.

| 역할 | 색 | Light | Dark |
|---|---|---|---|
| Primary (CTA·활성 탭) | 바이올렛 | `#6E56CF` | `#9B87F5` |
| Primary tint (종 태그=해자) | | `#EFEBFB` / 글씨 `#4A3596` | `#241C3D` / 글씨 `#C4B5FD` |
| Background | | `#FFFFFF` | `#0D0D0F` |
| Surface (card) | | `#FFFFFF` | `#17181B` |
| Secondary (일반 칩) | | `#F3F4F6` / 글씨 `#3F4551` | `#1F2024` / 글씨 `#B4B7C0` |
| Muted foreground | | `#6B7080` | `#9C9FA8` |
| Border | | `#EAECEF` | `#26272B` |
| Text | | `#111318` | `#F4F4F6` |

**색은 세 층으로 쓴다.** ① 브랜드(바이올렛) = 정체성, CTA·활성 탭에만 ② 정보/의미 = 상태 구분(`success`·`warning`·`destructive`), 반드시 아이콘 병행 ③ 중립 = 그 외 전부. **종 태그는 중립이 아니라 `bg-primary-tint`로 한 단계 올린다** — 특수동물 진료 태깅이 우리 해자인데 회색으로 죽이면 차별점이 안 보인다.

### UX 규칙 (터치 WebView 기준)

- **터치 우선.** hover에만 의존하는 인터랙션 금지. 모든 조작은 탭으로 완결돼야 한다. (웹 데스크톱의 hover는 보조 강화로만.)
- **최소 탭 영역 44×44px.**
- **`font-light`/`font-thin` 금지.** 얇은 획이 독해를 저해한다.
- **색상만으로 정보를 전달하지 않는다.** 아이콘·텍스트 병행 (특히 status 색).
- **본문(성분·후기·사전)의 텍스트 선택을 막지 않는다.** 조작 요소만 `select-none`. 정보 앱에서 복사를 막는 것은 사용자 적대적이다.
- **Safe Area 준수.** 노치/홈 인디케이터는 `pt-safe-top`/`pb-safe-bottom` 토큰으로.

## Git

- 커밋 메시지는 **한국어**.
- 형식: `유형(#이슈번호): 작업 내용/작성자`
  - `feat(#12): 장소 반경 검색 RPC 추가/Claude`
  - 작성자를 붙여 사용자 커밋과 Claude 커밋을 구분한다.
- 유형: `feat` `fix` `refactor` `style` `test` `chore` `docs` `design`
- 브랜치: `유형/도메인/#이슈번호-설명` (예: `feat/map/#12-nearby-rpc`)
- **푸시는 사용자가 명시적으로 요청할 때만.**
- 하나의 논리적 변경이 끝나면 즉시 커밋한다.
- **저자 구분**: Claude 작업 커밋은 `--author="Claude <noreply@anthropic.com>"` + 제목 `/Claude`, 사용자가 수정한 코드 커밋은 사용자 저자로 `/Claude` 없이. 상세는 [git-convention](docs/conventions/git-convention.md).

## 언어

한국어로 답한다. 코드 식별자와 기술 용어는 원문 유지.
