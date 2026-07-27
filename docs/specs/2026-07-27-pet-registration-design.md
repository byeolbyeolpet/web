# 펫 등록 설계 (Pet Registration)

- 날짜: 2026-07-27
- 상태: 확정 (구현 전)
- 관련: [#34](https://github.com/byeolbyeolpet/web/issues/34), [ADR-0005](../adr/0005-species-code-system.md) 종 코드 체계, [router.md](../router.md)

## 맥락

로그인은 되는데 **로그인해서 할 일이 없다.** 펫 등록은 M2 의 마무리이자 앱의 축이다 — 이후 지도(내 종 필터), 후기(방문 종), 커뮤니티가 전부 이 데이터를 참조한다.

동시에 **`species` 시드 14종의 첫 실전 사용**이다. 종 코드 체계·`sort_order`·`group` 이 실제 화면에서 작동하는지 여기서 처음 검증된다.

스키마 그릇은 이미 있다. `pets` 에서 **실제 NOT NULL 은 `name` 과 `species_code` 둘뿐**이고, `sex` 는 `'unknown'` 기본값이 있으며 나머지(`breed_id`·`birth_date`·`neutered`·`weight_kg`·`avatar_url`)는 전부 nullable 이다. 스키마가 이미 "최소로 받고 나중에 채운다"를 허용하게 생겼다.

## 결정

### 1. 범위 — 이름 · 종 · 성별 + 목록

첫 버전은 **등록 폼(3필드) + 마이 탭 목록**까지다.

브레인스토밍에서 "풀 펫 프로필"(전 필드 + 사진 + 수정/삭제)을 한 번 채택했다가 되돌렸다. 되돌린 이유는 **품종을 어떻게 받을지 물으면서 드러났다** — 지도 필터도 병원 태깅도 후기 방문종도 전부 `species_code` 만 본다. 생일·중성화·체중·품종은 **현재도 당분간도 소비처가 없다.** 풀 프로필은 갈 곳 없는 데이터를 미리 쌓는 일이었다.

`species` 시드 검증이라는 이슈 본래 목적은 3필드로 충분히 달성된다.

**범위 밖 (후속 이슈로 분리):** 사진 업로드(Supabase Storage 신규 · 후기 영수증 인증과 기반을 공유하므로 그쪽과 함께 설계하는 편이 낫다), 품종, 생일·중성화·체중, 수정·삭제.

### 2. 종 선택 UI — 14종 균등 그리드

3열 그리드에 `sort_order` 순서대로 14개를 전부 편다. 스크롤·탭·검색 없음.

**그룹 탭을 배제한 이유는 데이터가 비대칭이기 때문이다.** `group` 은 `dog` 1종 / `cat` 1종 / `exotic` 12종이다. 탭을 만들면 두 탭이 항목 하나짜리가 된다.

**개·고양이를 크게 띄우는 안도 배제했다.** 특수동물 12종이 "그 외"로 밀리는데, CLAUDE.md 의 *"우리는 종을 안 가린다"* 와 정면으로 어긋난다. 이 화면은 우리 차별점의 첫인상이다 — 12종이 한 화면에 펼쳐지는 것 자체가 설명 없는 증명이다. 빈도 문제는 이미 해결돼 있다: 강아지·고양이가 `sort_order` 10·20 으로 그리드 맨 앞 두 칸이다.

부수 효과로 **코드에 종 분기가 없다.** 받아온 순서대로 렌더만 하므로 종이 추가돼도 UI 코드를 고치지 않는다. 순서는 계속 DB 가 갖는다(ADR-0005).

### 3. 종 그리드는 `entities/species` 에 둔다

`features/register-pet` 이 아니라 `entities/species/ui/species-picker.tsx` 다.

종 선택은 펫 등록 전용이 아니다. 지도의 내 종 필터, 후기의 방문 종, 커뮤니티 글의 종 태그가 전부 같은 선택 UI 를 쓴다. feature 안에 두면 두 번째 소비처에서 복제되거나 features 간 역참조가 생긴다.

### 4. 폼 스택 — react-hook-form + zod

3필드에 폼 라이브러리는 과해 보이지만, **이것이 우리 첫 폼이고 이후 모든 폼의 선례가 된다.** 후기 작성·커뮤니티 글·펫 상세 편집이 여기서 잡은 패턴을 따른다.

AGENTS.md 가 이미 이 전제로 쓰여 있다 — *"폼 필드 검증 메시지(Zod/RHF)는 필드 아래에 문장형으로 표시하고 toast 로 중복 노출하지 않는다."* 그리고 `react-hook-form`·`@hookform/resolvers` 는 설치만 돼 있고 아직 미사용이다. 여기서 쓰거나, 안 쓸 거면 지워야 하는 상태였다.

비용은 `shared/ui/form.tsx`(shadcn) 추가와 44px 터치 스케일 오버라이드다.

### 5. 종 그리드와 성별을 같은 RadioGroup 원시로

둘 다 단일 선택이다 — 14개 중 1개, 3개 중 1개. 같은 `RadioGroup` 을 쓰고 레이아웃만 다르게 간다(그리드 / 세그먼트).

버튼 배열로 만들면 스크린리더가 "선택 가능한 N개 중 하나"라는 관계를 읽지 못한다. 접근성은 이 프로젝트의 평가 축(CLAUDE.md 목표 1)이므로 여기서 아끼지 않는다.

### 6. 검증 — zod + DB check 제약

| 필드 | zod | DB |
|---|---|---|
| `name` | 1~20자(trim 후) | `char_length` check 제약 신규 |
| `species_code` | 필수 | NOT NULL + FK |
| `sex` | enum 3값 | enum + NOT NULL |

**DB 제약을 함께 거는 이유:** RLS 는 "본인 것만"을 볼 뿐 이름이 10만 자여도 통과시킨다. 클라이언트 검증만 두면 Supabase 를 직접 호출하는 경로에서 뚫린다. (이슈에 "이름 길이 등 추가 검토"로 기록돼 있던 항목이다.)

### 7. 구조

```
src/
├── app/(full)/pet/new/page.tsx        # 라우팅 껍데기
├── views/pet-new/                     # 화면 조립 (세션 가드 + 폼)
├── features/register-pet/
│   ├── ui/pet-form.tsx
│   ├── model/schema.ts                # zod
│   └── api/use-create-pet.ts
├── entities/
│   ├── species/ui/species-picker.tsx  # 14종 그리드 (신규)
│   └── pet/
│       ├── api/use-query-pets.ts      # 내 펫 목록
│       └── ui/pet-card.tsx
└── shared/ui/{form,radio-group}.tsx   # shadcn 신규
```

라우트가 `(full)` 인 근거는 router.md 의 *"파고드는 화면(상세·작성·검색), 뒤로가기 중심"* 이다. `post/new` 가 선례다.

### 8. 데이터 흐름

```
species-picker ──useQuerySpecies()──> species (staleTime 1h, 기존 훅 재사용)
pet-form ──useCreatePet()──> insert pets ──invalidate──> QUERY_KEYS.pet.listByOwner
                                        └──> router.replace('/me')
me view ──useQueryPets(session.user.id)──> pet-card 목록 / 없으면 빈 상태
```

**빈 상태는 목록 안에 직접 만든다.** 기존 `shared/ui/screen-placeholder.tsx` 는 재사용하지 않는다 — 그건 "준비 중" 문구가 박힌 **스캐폴딩용**이라, 펫이 없는 사용자에게 준비 중이라고 말하게 된다. 빈 상태는 안내 한 줄 + 등록 CTA 면 되므로 공용 컴포넌트로 뽑지 않는다(소비처 1곳).

`QUERY_KEYS.pet` 을 `shared/config/query-keys.ts` 에 추가한다. 소유자별 목록이므로 `listByOwner(ownerId?)` 가 필요하다.

`/pet/new` 는 `useRequireSession` 으로 가드한다(클라이언트 가드 — [ADR-0004](../adr/0004-client-side-supabase-auth.md)).

### 9. 사용자 문구

`APP_MESSAGE.pet` 을 신설한다(등록 실패·목록 로드 실패). 원본 Supabase 에러는 `console.error` 로만 남긴다. 필드 검증 메시지는 zod 스키마에 두고 필드 아래에 표시하며 toast 로 중복 노출하지 않는다.

## 결과

**긍정**

- `species` 시드가 실물로 검증된다 — 그룹·순서·코드 체계가 화면에서 작동하는지 확인되는 첫 지점.
- 종 분기가 코드에 없다. 종 추가는 여전히 마이그레이션 한 줄이다.
- 폼 패턴·RadioGroup 원시·`APP_MESSAGE.pet` 이 이후 폼들의 기반이 된다.
- 로그인에 목적이 생긴다.

**부정 / 트레이드오프**

- **펫 프로필이 얇다.** 사진도 품종도 없어서 "등록만 되는" 화면이다. 후속 이슈가 붙기 전까지는 미완성으로 보인다.
- **ADR-0005 가 어긋난 상태로 남는다.** 거기엔 *"펫 등록 UI 를 만들 때 품종 시드가 함께 필요하다"* 고 적혀 있는데 이번엔 품종을 받지 않는다. **품종 후속 이슈에서 ADR-0005 에 "품종은 필터·검색 소비처가 생길 때 정규화한다"는 갱신을 남긴다.**
- **수정·삭제가 없다.** 잘못 등록하면 지울 방법이 없다. 후속 이슈의 우선순위를 여기에 둔다.

## 고려한 대안

- **풀 펫 프로필(전 필드 + 사진 + 수정/삭제)**: 한 번 채택했다가 되돌렸다. 소비처 없는 데이터를 쌓고, Supabase Storage 설계를 후기 영수증 인증과 떼어놓게 된다. 배제.
- **품종 자유 텍스트(`breed_text` 열 추가)**: 가장 빠르지만 `breed_id` 와 두 경로가 생기고, 지금 품종을 보여줄 화면 자체가 없다. 후속으로 미룸.
- **종 선택 그룹 탭**: `group` 비대칭(1/1/12)으로 성립하지 않는다. 배제.
- **종 선택 검색창**: 14개에 검색은 단계를 하나 더 시키는 것뿐이다. 종이 30개를 넘으면 재검토한다.
- **폼을 `useState` 로**: 3필드엔 충분하지만 두 번째 폼에서 다시 정하게 되고 선례가 어긋난다. 배제.
- **등록을 바텀시트로**: 14칸 그리드 + 입력 + 성별이면 시트 높이가 부담스럽고, 키보드가 올라오면 그리드가 가려진다. `(full)` 전체 화면으로.
