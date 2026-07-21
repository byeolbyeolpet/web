# features

사용자의 한 가지 행동/상호작용. "무엇을 한다"의 단위다.

- **예**: `auth/`, `write-post/`, `review-place/`, `search-ingredient/`, `filter-places/`
- **import 가능**: entities · shared
- **import 금지**: views, widgets, 다른 feature, app
- **슬라이스 구조**: `features/<name>/{ui, model, api}` + `index.ts`
