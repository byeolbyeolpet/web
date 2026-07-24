# 디자인 컨벤션

컬러·폰트·radius·safe-area 토큰은 `src/app/globals.css`와 `CLAUDE.md`의 디자인 시스템에 있다(무채색 크롬 + 바이올렛 단일 브랜드). 이 문서는 **적용 규칙**만 다룬다.

## 1. 토큰 사용

- **HEX 하드코딩 금지.** `bg-primary`, `bg-primary-tint`, `text-muted-foreground`, `border-destructive` 같은 시맨틱 토큰을 쓴다.
- **브랜드 색은 CTA·활성 탭에만.** 종 태그는 `bg-primary-tint`(Badge 의 `variant="tint"`)로 한 단계 올린다 — 특수동물 진료 태깅이 해자인데 무채색으로 두면 차별점이 안 보인다. 그 외는 전부 중립.
- 모든 컴포넌트는 **라이트/다크 모드**를 반드시 함께 설계한다.
- 기존 `shared/ui`의 스타일 패턴을 계승해 일관성을 유지한다.

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
- 한국어 UI 문구에서 문장 종료 마침표 뒤 다음 문장이 이어지면 `<br />`, `whitespace-pre-line`+`\n`, 또는 별도 문단으로 줄바꿈한다.

## 5. 터치 UX (CLAUDE.md UX 규칙)

- 최소 탭 영역 44×44px, hover 의존 금지(모든 조작은 탭으로 완결), `font-light`/`font-thin` 금지.
- 색상만으로 정보 전달 금지(아이콘·텍스트 병행), 본문 텍스트 선택 허용(`select-none`은 조작 요소·크롬(헤더/탭바)만), Safe Area 준수.

## 6. shadcn 컴포넌트

- 새로 조합할 때 Context7 문서와 `shared/ui`의 기존 래퍼를 함께 확인한다.
- 그룹 기반 컴포넌트(`DropdownMenuItem` 등)는 `DropdownMenuGroup` 안에 둔다.
- Dropdown·Dialog·Popover처럼 클릭 후 렌더되는 컴포넌트는 **빌드 통과만으로 끝내지 말고 실제 트리거 클릭까지 확인**한다.

### 6-1. 원본에서 손댄 것 — 새로 설치할 때 되돌아간다

`components.json`의 `style`은 `radix-nova`인데 **데스크톱 밀도**라 기본 컨트롤이 32px 였다. 44px 규칙과 충돌해 `shared/ui`에서 고쳤고, `shadcn add`로 재설치하면 원본으로 덮인다. 재설치 후에는 아래를 다시 확인한다.

| 파일 | 손댄 것 |
|---|---|
| `button.tsx` | 사이즈 스케일을 sm 44 / default 48 / lg 56 로 올리고 `xs`·`icon-xs` 삭제 |
| `input.tsx` | 높이 32 → 48 |
| `card.tsx` · `dialog.tsx` | 경계를 `ring-foreground/10` → `border-border` 로 통일 |
| `dialog.tsx` | 오버레이 `black/10` → `black/40`, 문구 "Close" → "닫기", 헤더 `pr-11`(닫기 버튼 자리) |
| `badge.tsx` | 종 태그용 `tint` 변형 추가 |

**버튼·입력은 44px 미만 사이즈를 만들지 않는다.** 못 누르는 사이즈를 API에 남겨두면 결국 쓰인다.

## 7. Dialog 규칙

- 트리거·제목·설명·핵심 요약·취소 버튼·주요 액션이 한눈에 보여야 한다.
- 톤 매핑: 일반 액션은 **primary(바이올렛)** 또는 기본 톤, 보조 액션은 **outline·secondary**, 되돌리기 어렵거나 파괴적인 액션(삭제·탈퇴·연결 해제)은 **destructive** 톤.
- 취소는 `DialogClose`로 감싸 실제로 닫히게 한다. 열었을 때 첫 포커스가 파괴적 액션이 아닌 곳에 가야 한다.
- 외부 서비스 흐름을 참고할 땐 구현 전 실제 화면을 조사·기록하고, 실제로 Popover·Dropdown·페이지 이동이면 그 구조를 우선 따른다.
