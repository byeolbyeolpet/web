# widgets

독립적으로 완결된 UI 블록. 여러 feature/entity를 조합한 큰 조각이다.

- **예**: `header/`, `bottom-nav/`, `sidebar/`, `place-map/`
- **import 가능**: features · entities · shared
- **import 금지**: views, 다른 widget(원칙), app
- **슬라이스 구조**: `widgets/<name>/{ui, model}` + `index.ts`
