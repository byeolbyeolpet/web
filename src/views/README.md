# views (FSD의 pages)

화면 단위. 라우트 하나에 대응하는 페이지 조립체다. Next의 `app/**/page.tsx`는 얇은 껍데기로, 여기 view를 불러 렌더만 위임한다. (FSD 원래 이름은 `pages`이나 Next `app/`과 충돌해 `views`로 개명.)

- **예**: `home/`, `map/`, `community/`, `me/`, `place-detail/`, `post-detail/`
- **import 가능**: widgets · features · entities · shared
- **import 금지**: 다른 view, app
- **슬라이스 구조**: `views/<name>/{ui, model}` + `index.ts`(공개 API)
