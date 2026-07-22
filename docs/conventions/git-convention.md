# Git 컨벤션

`CLAUDE.md`의 Git 절이 요약이고, 이 문서가 상세다.

## 작업 흐름 (이슈 주도)

**모든 작업은 이슈에서 시작한다.**

1. **작업 시작 = 이슈 생성.** 유형·라벨·마일스톤을 달고, 이슈 템플릿 형식(무엇/왜/완료조건)으로 쓴다. (`/start-task`)
2. `dev`에서 기능 브랜치를 판다.
3. 작업 → 논리 단위로 커밋(저자 규칙 준수).
4. **PR 올리기 전에 이슈를 업데이트**하고(진행/완료 코멘트) PR을 만든다. PR은 `.github/PULL_REQUEST_TEMPLATE.md` 형식을 채우고 `Closes #N`으로 이슈를 닫는다. (`/pr`)

이슈·PR 둘 다 **템플릿을 반드시 지킨다.** 검증(`/verify`)이 통과하지 않은 채로 PR을 올리지 않는다.

## 커밋

- 커밋 메시지는 **한글**.
- 형식: `유형(#이슈번호): 내용/작성자` — 예: `feat(#12): 장소 반경 검색 RPC 추가/Claude`.
- 하나의 논리적 변화가 끝나면 즉시 커밋한다.
- **푸시는 사용자가 명시적으로 요청·허락할 때만** 한다.

### 유형

`feat`(기능) · `fix`(버그) · `refactor` · `style`(간단 CSS) · `test` · `chore`(설정·문서·잡무) · `docs` · `design`.

### 저자(author) 규칙

커밋을 누가 만들었는지 git 저자로 구분한다.

- **Claude가 작업한 커밋**: `git commit --author="Claude <noreply@anthropic.com>"`, 제목 끝에 `/Claude`, 본문 끝에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **사용자가 수정한 코드 커밋**: 기본 저자(사용자)로 커밋하고 `/Claude`·`Co-Authored-By`를 붙이지 않는다.

## 브랜치

**브랜치 모델**: `main` = 릴리스, `dev` = 기본·통합 브랜치. 기능은 `dev`에서 분기해 PR로 `dev`에 병합하고, 배포 시점에 `dev` → `main`으로 올린다.

- 이름: `유형/도메인/#이슈번호-설명` — 예: `feat/map/#12-nearby-rpc`.
- 도메인 하위 기능은 `유형/도메인/기능/#이슈번호` — 예: `feat/community/sort/#47`.

## PR

`.github/PULL_REQUEST_TEMPLATE.md`를 쓴다. 요점:

- 작업 내용은 사용자 관점으로 쓰고, DB·RPC·RLS 등 외부 상태 변경이 있으면 함께 적는다.
- 테스트 결과(`npm run build` 등, 스키마 변경 시 `npm run db:types`)를 명시하고, 확인 못 한 항목은 사유를 적는다.
- 연관 이슈는 마지막에 `Closes #이슈번호`.

### 머지

**rebase 머지만 사용한다.** repo 설정에서 squash·merge commit을 비활성화했다. 기능 브랜치는 CI(verify·e2e) 통과 후 `dev`로 rebase 머지하고 브랜치를 삭제한다. (히스토리를 선형으로 유지한다.)
