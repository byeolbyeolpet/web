# entities

도메인 모델. 데이터의 형태와 그것을 표시하는 최소 UI다.

- **예**: `pet/`, `place/`, `post/`, `review/`, `user/`, `species/`
- **종·글 카테고리를 폴더로 쪼개지 않는다.** discriminated union으로 타입만 가른다 (CLAUDE.md 참조).
- **import 가능**: shared
- **import 금지**: 그 위 모든 레이어
- **슬라이스 구조**: `entities/<name>/{ui(카드 등), model(타입·스토어), api(쿼리)}` + `index.ts`
