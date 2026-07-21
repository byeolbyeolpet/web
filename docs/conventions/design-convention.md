# 디자인 컨벤션

컬러·폰트·radius·safe-area 토큰은 `src/app/globals.css`와 `CLAUDE.md`의 디자인 시스템에 있다(테라코타·딥틸·크림). 이 문서는 **적용 규칙**만 다룬다.

## 1. 토큰 사용

- **HEX 하드코딩 금지.** `bg-primary`, `text-anchor`, `text-muted-foreground`, `border-destructive` 같은 시맨틱 토큰을 쓴다.
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
- 색상만으로 정보 전달 금지(아이콘·텍스트 병행), 본문 텍스트 선택 허용(조작 요소만 `select-none`), Safe Area 준수.

## 6. shadcn 컴포넌트

- 새로 조합할 때 Context7 문서와 `shared/ui`의 기존 래퍼를 함께 확인한다.
- 그룹 기반 컴포넌트(`DropdownMenuItem` 등)는 `DropdownMenuGroup` 안에 둔다.
- Dropdown·Dialog·Popover처럼 클릭 후 렌더되는 컴포넌트는 **빌드 통과만으로 끝내지 말고 실제 트리거 클릭까지 확인**한다.

## 7. Dialog 규칙

- 트리거·제목·설명·핵심 요약·취소 버튼·주요 액션이 한눈에 보여야 한다.
- 톤 매핑: 일반 액션은 **primary(테라코타)** 또는 기본 톤, 탐색·신뢰가 필요한 곳은 **anchor(딥틸)**, 되돌리기 어렵거나 파괴적인 액션(삭제·탈퇴·연결 해제)은 **destructive** 톤.
- 외부 서비스 흐름을 참고할 땐 구현 전 실제 화면을 조사·기록하고, 실제로 Popover·Dropdown·페이지 이동이면 그 구조를 우선 따른다.
