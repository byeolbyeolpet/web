# 디자인 컨벤션

컬러·폰트·radius·safe-area 토큰은 `src/app/globals.css`와 `CLAUDE.md`의 디자인 시스템에 있다(무채색 크롬 + 바이올렛 단일 브랜드). 이 문서는 **적용 규칙**만 다룬다.

## 1. 토큰 사용

- **HEX 하드코딩 금지.** `bg-primary`, `bg-primary-tint`, `text-muted-foreground`, `border-destructive` 같은 시맨틱 토큰을 쓴다.
- **브랜드 색은 CTA·활성 탭에만.** 종 태그는 `bg-primary-tint`(Badge 의 `variant="tint"`)로 한 단계 올린다 — 특수동물 진료 태깅이 해자인데 무채색으로 두면 차별점이 안 보인다. 그 외는 전부 중립.
- 모든 컴포넌트는 **라이트/다크 모드**를 반드시 함께 설계한다.
- 기존 `shared/ui`의 스타일 패턴을 계승해 일관성을 유지한다.

### 1-1. HEX 리터럴 명시적 예외 — CSS 변수가 닿지 않는 렌더링 경로

아래 세 곳은 브라우저 밖(빌드 시점 이미지 생성·OS 크롬·정적 에셋)에서 색을 읽어 **CSS 변수를 참조할 수 없다.** HEX 리터럴이 허용되는 유일한 예외이며, 그래서 **팔레트를 바꾸면 이 세 파일을 반드시 함께 갱신한다**(체크리스트).

| 파일 | 이유 |
|---|---|
| `src/app/apple-icon.tsx` | `ImageResponse`(satori)가 빌드 시점에 PNG 를 그린다 — CSS 로드 전 |
| `src/app/layout.tsx` 의 `viewport.themeColor` | OS/브라우저 크롬이 메타데이터로 읽는다 — CSS 적용 대상 아님 |
| `src/app/icon.svg` | 정적 SVG 에셋 — CSS 커스텀 프로퍼티가 닿지 않는다 |

### 1-2. 외부 콘솔 업로드용 아이콘 — `icon.svg` 파생 산출물

`docs/brand/app-icon-512.png` 는 **`icon.svg` 를 512px 로 래스터화한 파생물**이다. 카카오 디벨로퍼스·앱 스토어처럼 PNG 업로드만 받는 외부 콘솔에 쓴다.

`public/` 이 아니라 `docs/` 에 두는 이유: 앱이 런타임에 참조하지 않는다. 안드로이드 앱 아이콘은 `android/app/src/main/res/mipmap-*` 에 있고 우리는 PWA manifest 도 없어서, `public/` 에 두면 Static Export 가 그대로 APK 에 실어 나르는 죽은 무게가 된다.

마크나 팔레트를 바꾸면 위 세 파일과 함께 다시 뽑는다 (`sharp` 는 Next 의존성으로 이미 설치돼 있다):

```bash
node -e "const s=require('sharp'),f=require('fs');f.mkdirSync('docs/brand',{recursive:true});s(f.readFileSync('src/app/icon.svg'),{density:800}).resize(512,512).png().toFile('docs/brand/app-icon-512.png')"
```

## 2. `cn` 사용 규칙

가독성이 최우선이다.

1. 클래스가 짧고(약 40자 미만) 조건부가 없으면 `className="..."` 문자열을 직접 쓴다.
2. 길거나(약 40자 이상) 조건부가 있으면 **반드시 `cn()`을 쓰고 논리 단위(Layout, Sizing, Interactive 등)로 묶어 줄바꿈**한다. 주석은 달지 않는다.

```tsx
<div
  className={cn(
    "flex items-center gap-2",
    "h-11 w-full max-w-100",
    "bg-primary transition-colors",
  )}
/>
```

## 3. 모바일 우선

- 모든 컴포넌트는 모바일 뷰(375px 내외)를 기본으로 스타일링한다(터치 WebView가 타깃).
- `sm:`/`md:`/`lg:` 접두사는 스타일을 **추가·덮어쓰기**하는 용도로만: `flex-col`→`sm:flex-row`, `w-full`→`sm:w-auto`, `p-4`→`sm:p-6`.

## 4. 스페이싱·사이징

- **임의값(`[...]`) 지양.** 4px 단위(`100px` → `min-h-25`)를 쓴다.
- 줄바꿈 유틸은 `break-words` 대신 `wrap-break-word`.
- **두 줄 이상이 될 수 있는 한국어 문구(화면 제목·안내문)에는 `break-keep`을 함께 준다.** 기본값(`word-break: normal`)은 한국어를 글자 단위로 끊어 "함께 사는 아이/를 등록해주세요"처럼 어절이 갈라진다. `text-balance`를 같이 주면 줄 길이도 고르게 나뉜다.
- 한국어 UI 문구에서 문장 종료 마침표 뒤 다음 문장이 이어지면 `<br />`, `whitespace-pre-line`+`\n`, 또는 별도 문단으로 줄바꿈한다.

## 5. 터치 UX (CLAUDE.md UX 규칙)

- 최소 탭 영역 44×44px, hover 의존 금지(모든 조작은 탭으로 완결), `font-light`/`font-thin` 금지.
- **처리 중인 버튼은 `loading` prop을 쓴다.** 문구를 "저장" → "저장 중…"으로 바꾸지 않는다 — 버튼 폭이 흔들리고, 진행 중이라는 사실은 스피너가 이미 말한다. `loading`이 `disabled`와 `aria-busy`까지 함께 건다(연타로 요청이 두 번 나가는 것도 막는다).
- 색상만으로 정보 전달 금지(아이콘·텍스트 병행), 본문 텍스트 선택 허용(`select-none`은 조작 요소·크롬(헤더/탭바)만), Safe Area 준수.

## 6. shadcn 컴포넌트

- 새로 조합할 때 Context7 문서와 `shared/ui`의 기존 래퍼를 함께 확인한다.
- 그룹 기반 컴포넌트(`DropdownMenuItem` 등)는 `DropdownMenuGroup` 안에 둔다.
- Dropdown·Dialog·Popover처럼 클릭 후 렌더되는 컴포넌트는 **빌드 통과만으로 끝내지 말고 실제 트리거 클릭까지 확인**한다.

### 6-1. 원본에서 손댄 것 — 새로 설치할 때 되돌아간다

`components.json`의 `style`은 `radix-nova`인데 **데스크톱 밀도**라 기본 컨트롤이 32px 였다. 44px 규칙과 충돌해 `shared/ui`에서 고쳤고, `shadcn add`로 재설치하면 원본으로 덮인다. 재설치 후에는 아래를 다시 확인한다.

| 파일 | 손댄 것 |
|---|---|
| `button.tsx` | 사이즈 스케일을 sm 44 / default 48 / lg 56 로 올리고 `xs`·`icon-xs` 삭제. **`loading` prop 추가** — 스피너 + `disabled` + `aria-busy`. `link`·`destructive` 변형의 글자를 `*-emphasis` 로 |
| `input.tsx` | 높이 32 → 48 |
| `card.tsx` · `dialog.tsx` | 경계를 `ring-foreground/10` → `border-border` 로 통일 |
| `dialog.tsx` | 오버레이 `black/10` → `black/40`, 문구 "Close" → "닫기", 헤더 `pr-11`(닫기 버튼 자리) |
| `badge.tsx` | 종 태그용 `tint` 변형 추가. `link`·`destructive` 변형의 글자를 `*-emphasis` 로 |
| `field.tsx` | 설명 링크 hover 를 `text-primary-emphasis` 로 |
| `dropdown-menu.tsx` | `destructive` 아이템의 글자를 `text-destructive-emphasis` 로 |

**AlertDialog 를 직접 쓰지 않는다 — `ConfirmDialog`(shared/ui)를 쓴다.** 원본은 데스크톱 밀도(max-w-xs·32px 버튼·footer 회색 띠)라 모바일 확인창으로 어색하다. ConfirmDialog 가 폭·라운드·44px 버튼·tint 아이콘을 갖추고, 문구는 APP_MESSAGE 코드로만 받는다.

**(full) 화면의 제목은 `PageHeading`(shared/ui)으로 쓴다.** Title 명사형 + Description 문장형(APP_MESSAGE 와 같은 규칙). 헤더에는 페이지명을 넣지 않기로 했으므로 위치를 말하는 건 이 블록뿐이다.

**버튼·입력은 44px 미만 사이즈를 만들지 않는다.** 못 누르는 사이즈를 API에 남겨두면 결국 쓰인다.

### 6-2. `shadcn add`가 조용히 실패하거나 남의 파일을 덮는다

**빈 스텁**: `radix-nova` 레지스트리에 항목은 있는데 내용이 비어 있는 경우가 있다. `form`이 그랬다 — `GET /r/styles/radix-nova/form.json`이 200에 109바이트고 `files`가 없어서 CLI가 **exit 0으로 아무 파일도 안 쓰고 끝난다.** 설치했는데 파일이 없으면 레지스트리 JSON을 직접 확인한다. (shadcn이 RHF 연동을 `Form`→`Field`로 옮기는 중이라 신규 스타일엔 구세대 `form`이 없다. 우리는 `Field` 계열을 쓴다.)

**항상 `--dry-run` 을 먼저 돌린다.** 어떤 파일이 덮이는지 실행 전에 알려준다. 이게 유일한 사전 방어다 — 4.16.0 에 파일 단위 제외 플래그(`--no-deps` 류)는 **없고**, `--overwrite` 를 빼도 `--yes` 가 확인 프롬프트를 건너뛰므로 그대로 덮인다.

```
$ npx shadcn@latest add alert-dialog --yes --dry-run
├ Files (2) ~1 overwrite, =1 skip
│ ~ src\shared\ui\button.tsx        overwrite   ← 6-1 표의 파일이면 여기서 멈춘다
│ = src\shared\ui\alert-dialog.tsx  skip (identical)
```

`registryDependencies` 에 걸린 컴포넌트가 딸려오면서 덮인다. `alert-dialog` → `button` 이 그랬다. 6-1 표의 파일이 목록에 있으면 **작업 트리를 먼저 깨끗이 만들고**(커밋 또는 stash) 설치한 뒤 `git checkout -- <파일>` 로 되돌린다. 그래야 되돌릴 때 내 작업까지 날아가지 않는다.

**대화형 프롬프트**: 기존 파일을 덮어야 하면 `--yes`만으로는 확인 프롬프트에서 멎는다. `--yes --overwrite`로 통과시키되, 실행 후 `git status --porcelain`으로 **의도한 파일 외에 무엇이 덮였는지 반드시 확인**한다.

## 7. Dialog 규칙

- 트리거·제목·설명·핵심 요약·취소 버튼·주요 액션이 한눈에 보여야 한다.
- 톤 매핑: 일반 액션은 **primary(바이올렛)** 또는 기본 톤, 보조 액션은 **outline·secondary**, 되돌리기 어렵거나 파괴적인 액션(삭제·탈퇴·연결 해제)은 **destructive** 톤.
- 취소는 `DialogClose`로 감싸 실제로 닫히게 한다. 열었을 때 첫 포커스가 파괴적 액션이 아닌 곳에 가야 한다.
- 외부 서비스 흐름을 참고할 땐 구현 전 실제 화면을 조사·기록하고, 실제로 Popover·Dropdown·페이지 이동이면 그 구조를 우선 따른다.
