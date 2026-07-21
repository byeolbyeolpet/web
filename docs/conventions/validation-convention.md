# 검증 컨벤션

빌드·타입·린트·포맷·Git 검증의 반복 실패를 줄이는 실행 규칙. `AGENTS.md`의 "완료 전 검증"과 정합한다.

## 1. Windows 실행

- 기본 OS는 Windows다. **PowerShell**에서 `npm`/`npx` PS 셰임이 잘못된 전역 prefix를 잡아 실패하면 `C:\Program Files\nodejs\npm.cmd` / `npx.cmd`를 명시적으로 쓴다.
- **Bash(Git Bash) 도구**에서는 `npm`/`npx`가 정상 동작한다.

## 2. 처음부터 권한 상승으로 실행

sandbox/네트워크 제한에 걸린 이력이 있어 처음부터 상승 실행한다.

- `npm run build` — `next/font`가 Google Fonts를 fetch한다.
- `git add` / `git commit` — `.git` 메타데이터 쓰기가 필요하다.
- (Supabase CLI 세팅 후) `npm run db:types` — 원격 프로젝트에 접근한다.

## 3. 일반 권한으로 먼저 실행

로컬 파일 검사 중심이라 일반 권한으로 먼저 한다.

- `npm run typecheck`, `npm run format:check`, `npm run lint`, 단일 파일 `prettier --write`.
- `git status`, `git diff`, `git log`, `git show`.

일반 권한으로 실패했는데 원인이 파일 쓰기·네트워크·Git index 권한이면 **같은 명령을 반복하지 말고 즉시 상승 재실행**한다.

## 4. 검증 순서

코드·hook·라우트·공용 컴포넌트가 바뀐 경우:

1. `npm run typecheck`
2. `npm run format:check`
3. `npm run lint`
4. `npm run build`

Supabase 스키마·DB 로직(테이블·컬럼·enum·RPC·trigger·migration)이 바뀐 경우에만 맨 앞에 `npm run db:types`를 추가한다.

문서만 바뀐 경우 `npm run format:check`만 실행할 수 있다. (단, `.md`는 prettierignore 대상)

## 5. Supabase 검증

- RPC·RLS·table·trigger·function이 바뀌면 MCP `execute_sql`로 원격 상태를 확인한다.
- RPC 변경 후 `pg_proc`·`search_path`·`security invoker/definer`·`authenticated` 실행 권한, 제약 변경 후 `pg_constraint` 실제 적용 여부를 확인한다.

## 6. 실패 보고

- 같은 명령을 같은 권한으로 반복하지 않는다.
- 실패 원인을 `권한`·`네트워크`·`코드 오류`·`포맷 오류`·`환경 문제` 중 하나로 분류한다.
- 권한·네트워크로 확인되면 다음은 상승 실행한다.
- 검증을 생략하면 완료 보고에 생략 이유를 명시한다.
