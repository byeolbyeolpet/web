---
description: 코드 검증 — validation-convention 순서로 돌리고 결과 보고
---

`docs/conventions/validation-convention.md` 순서대로 검증하고 각 단계의 통과/실패를 구체적으로 보고한다.

바뀐 범위에 맞춰 실행한다.

- **코드·hook·라우트·공용 컴포넌트 변경**: 아래 4단계 전부
  1. `npm run typecheck`
  2. `npm run format:check`
  3. `npm run lint`
  4. `npm run build`
- **Supabase 스키마·DB 로직 변경**: 맨 앞에 `npm run db:types` 추가 (MCP 인증 후 가능)
- **문서만 변경**: `npm run format:check`만

실패하면 원인을 `권한`·`네트워크`·`코드 오류`·`포맷 오류`·`환경 문제`로 분류하고, 같은 명령을 같은 권한으로 반복하지 않는다.
