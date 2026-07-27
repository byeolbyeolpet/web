# 앱 메시지 컨벤션

사용자에게 노출되는 문구는 상수로 중앙 관리한다. 원본 Supabase/Auth/DB 에러는 사용자에게 직접 노출하지 않는다.

- `APP_MESSAGE` (toast·alert·error UI) → `shared/config/app-message.ts`
- `FORM_MESSAGE` (필드 검증 메시지) → `shared/config/form-message.ts`
- `APP_MESSAGE_CODE` (메시지 코드) → `shared/config/app-message.ts`

## title

- 짧은 명사형·상태형. 문장형·마침표·이모지·서술형(`~합니다`, `~했습니다`) 금지.
- 성공은 `완료`, 실패는 `실패`, 권한·상태는 `없음`·`불가`·`필요`처럼 결과가 분명한 단어로 끝낸다.

| 좋은 예 | 나쁜 예 |
|---|---|
| 리뷰 등록 완료 | 리뷰가 등록되었습니다. |
| 글 작성 실패 | 글 작성에 실패했습니다. |
| 위치 권한 없음 | 위치 권한이 없습니다. |
| 로그인 필요 | 로그인이 필요합니다. |

## description

- title만으로 부족한 안내를 문장형으로 작성한다. 다음에 할 행동이 있으면 여기 쓴다.
- 동적 값(닉네임·provider 등)을 호출부에서 직접 넘기는 경우 생략할 수 있다.
- 개발자 디버깅용 원본 에러는 넣지 않는다. Supabase/Auth/DB 원본 에러는 `console.error`로만 남기고 사용자에겐 고정 메시지만 보인다.

## Field Error (FORM_MESSAGE)

- Zod·RHF의 `FieldError`로 필드 아래에 표시하는 검증 메시지는 `FORM_MESSAGE`에서 관리하고, 사용자가 입력을 고칠 수 있게 문장형으로 쓴다.
- 필드 오류는 `setError`+`FieldError`로, 화면 전체에 알려야 하는 제출·서버 실패만 toast로. **필드 메시지를 toast로 중복 노출하지 않는다.**

## code

- `APP_MESSAGE`의 키 자체가 `"도메인.이름"` 형태의 메시지 코드다. 중첩 객체가 아니라 코드를 키로 두는 이유는 **코드 하나로 문구를 찾을 수 있어야** 헬퍼가 `as` 단언 없이 조회하기 때문이다.
- 호출부는 코드 문자열을 직접 쓰지 않고 `APP_MESSAGE_CODE.auth.signInFailed`처럼 상수를 쓴다.
- `APP_MESSAGE`와 `APP_MESSAGE_CODE`의 도메인·key는 반드시 일치시킨다. `satisfies`가 "값이 실재하는 코드인가"를 보고, 경로 불일치(`pet.createFailed` 자리에 다른 도메인 코드)와 한쪽 누락은 `app-message.test.ts`가 잡는다.
- toast는 `shared/lib/app-toast.ts`의 `toastAppSuccess(code)` / `toastAppError(code, cause)`로 띄운다. **호출부가 title·description을 조립하지 않는다.** 원본 에러는 `cause`로 넘기면 `console.error`로만 나가고 사용자 화면에는 닿지 않는다.
