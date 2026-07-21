# 코드 컨벤션

## 네이밍

| 대상 | 규칙 | 예시 |
|---|---|---|
| 변수·함수 | camelCase | `userName`, `getPlaceList()`, `isLoading` |
| 파일·폴더 | kebab-case | `place-card.tsx`, `use-nearby-places.ts` |
| 컴포넌트 | PascalCase | `PlaceCard`, `BottomNav` |
| 상수 | UPPER_SNAKE_CASE | `SPECIES_LIST`, `QUERY_KEYS` |
| 타입·인터페이스 | PascalCase | `interface Props`, `type Place` |

**파일명은 kebab-case로 통일한다.** FSD·Next 커뮤니티에서 가장 널리 쓰이고, Linux CI의 대소문자 이슈가 없다. 컴포넌트는 이름만 PascalCase이고 파일은 kebab-case다 (`PlaceCard` → `place-card.tsx`).

## 훅

- 파일 kebab-case (`use-nearby-places.ts`), 함수 camelCase (`useNearbyPlaces()`), `use-` 접두.
- TanStack Query를 쓰는 로직은 반드시 `use-query-*.ts` 형태의 훅으로 감싼다.
- 컴포넌트 안에서 `useForm`/`useState`/`useEffect` 기반 로직이 3줄 이상이면 커스텀 훅으로 분리한다.

### `useEffect` 단일 상태 보정

선택값이 탭·권한·옵션 변경으로 더 이상 유효하지 않아 기본값으로 되돌릴 때만, 해당 줄에서 lint를 끈다.

```tsx
useEffect(() => {
  if (!options.includes(value)) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(DEFAULT_VALUE);
  }
}, [value, options]);
```

## TanStack Query Key

- Query Key는 `shared/config/query-keys.ts`의 `QUERY_KEYS`에서 **중앙 관리**한다.
- 호출부에서 `[...QUERY_KEYS.place.all, "list"]`처럼 부분 배열을 직접 만들지 않는다.
- 하위 리소스 전체 대상(`invalidateQueries`, `setQueriesData` 등)이 필요하면 `listAll()`, `searchAll()` 같은 하위 루트 factory를 `QUERY_KEYS`에 먼저 추가하고 호출부는 그 factory만 쓴다.
- 개별 factory는 하위 루트 factory를 펼쳐 계층을 맞춘다 (`list()`는 `listAll()`을 펼치고 식별자·필터를 붙임).
- optional 값 제거는 `filter(Boolean)`이 아니라 `filter((v) => v !== undefined)`를 쓴다.
- 새 도메인은 `all`을 최상위 루트로, 재사용 하위 루트는 `{resource}All()` 형태로 명명한다.
