# entities

도메인 모델. 데이터의 형태와 그것을 표시하는 최소 UI다.

- **예**: `pet/`, `place/`, `post/`, `review/`, `user/`, `species/`
- **종·글 카테고리를 폴더로 쪼개지 않는다.** discriminated union으로 타입만 가른다 (CLAUDE.md 참조).
- **import 가능**: shared
- **import 금지**: 그 위 모든 레이어, **그리고 같은 레이어의 다른 entity**
- 두 도메인이 한 화면에 같이 나오면 그 위 레이어(views·widgets)가 조립한다. 예: 펫 카드에 종 아이콘이 필요할 때 `PetCard`가 `entities/species`를 import 하지 않고, `views/me`가 `speciesIcon` prop으로 주입한다.
- **슬라이스 구조**: `entities/<name>/{ui(카드 등), model(타입·스토어), api(쿼리)}` + `index.ts`
