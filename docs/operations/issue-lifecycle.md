# 유지보수 Issue 작업 수명주기

이 문서는 유지보수 Issue를 반복 처리할 때 지켜야 할 Issue contract, PR lifecycle, verification evidence 절차를 정리한다.

## 상태 전이

```text
Issue OPEN
  → 원본 라우팅 확인
  → Issue 번호가 포함된 작업 브랜치 생성
  → 구현 및 Issue 테스트 작성
  → 검증 evidence 생성
  → Issue를 참조하는 PR OPEN
  → 사람 review 및 CI 통과
  → PR MERGED
  → Issue CLOSED
```

PR이 merge되지 않고 닫히면 작업 완료로 간주하지 않는다. Issue는 닫지 말고 기존 PR을 재오픈하거나 새 PR을 만든다. PR을 재오픈하거나 새 커밋을 push하면 현재 head SHA 기준으로 검증 evidence를 새로 만든다.

## 시작 전 확인

```bash
gh issue view <number> --json number,state,title
git status --short --branch
gh pr list --head <branch> --state all
```

- Issue는 OPEN이어야 한다.
- 브랜치 이름에는 Issue 번호를 포함한다(예: `fix/issue-42-expiry`).
- 기존 CLOSED·UNMERGED PR이 있으면 재오픈 여부를 먼저 확인한다.
- 원본 문서는 `AGENTS.md` 라우팅에 따라 확인한다.

## Issue contract

- PR 본문은 `Fixes #N`, `Closes #N`, `Resolves #N`, 또는 `Refs #N`으로 Issue를 연결한다.
- 최소 하나의 커밋 메시지에도 `#N`을 포함한다.
- acceptance criteria에 대응하는 `tests/issues/issue-N-*.test.ts`를 둔다.
- 구현 시도는 Issue의 최대 횟수를 넘지 않는다. 기본값은 3회이며, 초과하면 `NEEDS_HUMAN`으로 중단한다.
- 불충족 항목은 추측으로 통과시키지 않고 실패 사유와 필요한 사람의 판단을 기록한다.

로컬 metadata 예시는 다음 명령으로 검사할 수 있다.

```bash
npx tsx scripts/issue-contract.ts '{"issueNumber":5,"issueState":"OPEN","branch":"fix/issue-5-popup-expiry","commitMessages":["fix: resolve popup expiry (#5)"],"pullRequestBody":"Fixes #5","testFiles":["tests/issues/issue-5-popup-expiry.test.ts"],"maxAttempts":3}'
```

## Verification evidence

검증 결과에는 항상 다음을 포함한다.

- Issue/PR 번호
- 현재 검증한 commit SHA
- 구현 시도 번호
- 실행 시각
- 순서가 보장된 단계별 결과(`passed`, `failed`, `blocked`, `not-run`)
- 실패 명령과 핵심 출력
- `NEEDS_HUMAN` 사유

기계 판독용 JSON과 PR summary용 Markdown은 `scripts/verification-evidence.ts`의 serializer/formatter 형식을 사용한다. 비밀값·세션 키·데이터베이스 인증정보는 evidence에 넣지 않는다.

`npm run verify`가 Protected 단계에서 중단되면 승인 범위를 추측하거나 우회하지 않는다. 검증 결과를 `blocked`로 기록하고 사람에게 정확한 보호 경로 승인 범위를 요청한다.

## PR 완료 전 확인

```bash
git rev-parse HEAD
git status --short --branch
gh pr view <number> --json state,headRefName,mergeStateStatus,statusCheckRollup
```

- PR head SHA가 evidence의 SHA와 일치해야 한다.
- CI가 최신 head SHA에서 성공해야 한다.
- formal human review가 필요한 경우 승인 review가 있어야 한다.
- PR이 MERGED인지 확인한 뒤 Issue가 CLOSED인지 확인한다.
- merge 후 작업 브랜치 삭제 정책을 적용한다.

## 현재 자동화의 한계

이 문서의 절차는 현재 저장소에서 재현 가능한 운영 규칙이다. 다만 repository settings에 branch protection/ruleset을 설정하지 않으면 required check, required review, main 직접 push 차단은 강제되지 않는다. GitHub Actions가 Issue API를 조회하거나 PR comment를 갱신하는 자동화도 별도 workflow 권한과 보호 경로 승인이 필요하다.
