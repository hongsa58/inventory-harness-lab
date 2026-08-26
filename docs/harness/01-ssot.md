# Harness SSOT

> 상태: 초안 · 최종 갱신: 2026-08-26 · 저장소: [hongsa58/inventory-harness-lab](https://github.com/hongsa58/inventory-harness-lab)

이 문서는 프로젝트의 **원본(Source of Truth, SSOT) 위치와 적용 범위**를 정하는 문서다. 세부 규칙을 복제하지 않으며, 원본이 없는 영역은 임의로 채우지 않고 `TBD`로 남긴다.

## 1. 핵심 원칙

다음 원칙을 모든 기획, 구현, 검증, 문서 변경에 적용한다.

1. **원본을 먼저 확인한다.** 코드를 수정하기 전에 관련 요구사항과 아키텍처 원본을 확인한다.
2. **권한 있는 원본만 따른다.** 참고 문서, Issue, 구현 코드로 원본을 임의로 대체하지 않는다.
3. **추측하지 않는다.** 근거가 없거나 충돌이 해결되지 않은 내용은 `TBD`로 기록한다.
4. **변경을 연결한다.** 모든 작업은 `Issue → 원본 → 구현 → 검증 결과`의 추적 경로를 남긴다.
5. **원본과 구현을 함께 갱신한다.** 원본의 규칙을 바꾸면 영향을 받는 Issue, 코드, 검증, 참고 문서를 확인한다.
6. **검증 가능한 상태로 완료한다.** 수락 기준과 검증 결과를 기록하지 않은 작업은 완료로 표시하지 않는다.
7. **중복 정의를 만들지 않는다.** 같은 규칙을 여러 문서에 복사하지 말고 권위 있는 원본을 링크한다.
8. **범위를 지킨다.** 현재 작업과 무관한 규칙이나 요구사항을 함께 변경하지 않는다.

## 2. 원본 레지스트리

| 영역 | 권위 있는 원본 | 권위 범위 | 상태 |
|---|---|---|---|
| 재고 도메인 | [`docs/01-requirements.md`](../01-requirements.md) | 재고 개념, 업무 규칙, 기능·비기능 요구사항, 범위, 완료 기준 | 지정됨 |
| 아키텍처 | [`docs/06-architecture.md`](../06-architecture.md) | 기술 선택, 시스템 구조, 데이터 흐름, 도메인 구현 계약 | 지정됨 |
| 개별 작업 | 해당 작업의 [GitHub Issue](https://github.com/hongsa58/inventory-harness-lab/issues) | 작업 목적, 범위, 수락 기준, 상태 및 작업별 결정 | 지정됨(작업별 Issue 필요) |
| 검증 규칙 | [`docs/harness/02-verification.md`](./02-verification.md) | 자동 검증 규칙과 실행 기준 | 지정됨 |
| 구현·검증 루프 | 추후 생성될 루프 정의/자동화 | 구현 → 검증 → 결과 반영의 절차 | **TBD — 현재 없음** |

### 개별 작업 Issue 기록 규칙

개별 작업을 시작할 때 해당 GitHub Issue를 먼저 만들고, 작업 브랜치·커밋·PR에서 그 Issue를 연결한다. 이 문서에는 특정 Issue 번호를 고정하지 않는다. 작업별 SSOT 링크는 다음 형식으로 기록한다.

```text
Issue: https://github.com/hongsa58/inventory-harness-lab/issues/<issue-number>
```

Issue에 재고 도메인 또는 아키텍처 규칙을 새로 정의하지 않는다. 그런 규칙이 필요하면 해당 SSOT 문서를 변경하고 Issue에서 그 변경을 참조한다. Issue의 수락 기준은 작업 결과를 판단하는 기준이며, 도메인·아키텍처 원본과 충돌할 경우 아래 우선순위 규칙을 따른다.

## 3. 적용 우선순위와 충돌 처리

1. **재고의 의미와 업무 규칙**은 `docs/01-requirements.md`를 따른다.
2. **기술 구조와 구현 계약**은 `docs/06-architecture.md`를 따른다.
3. **개별 작업의 범위·수락 기준·상태**는 해당 GitHub Issue를 따른다.
4. 그 밖의 문서(`02-personas`, `03-scenarios`, `04-engagement`, `05-design`, `07-plan`, `HANDOVER`, `README`)는 각자의 목적에 따른 참고·설명·계획·현황 자료다. 위 영역의 원본을 대체하지 않는다.

충돌 상태는 다음과 같이 처리한다.

- **참고 문서와 SSOT가 충돌하면 SSOT를 우선한다.** 참고 문서를 SSOT에 맞게 갱신할 필요가 있으면 변경 범위를 기록한다.
- **GitHub Issue와 SSOT가 충돌하면 `NEEDS_HUMAN` 상태를 선언하고 사람의 판단을 요청한다.** AI는 Issue 또는 SSOT 중 하나를 임의로 우선하지 않으며, 판단 전에는 충돌의 영향을 받는 변경을 진행하지 않는다.
- **서로 다른 SSOT가 충돌하면 `NEEDS_HUMAN` 상태를 선언하고 사람의 판단을 요청한다.** 어느 SSOT가 우선인지 AI가 결정하지 않으며, 판단 전에는 충돌의 영향을 받는 변경을 진행하지 않는다.
- **AI는 충돌이 발생했을 때 자신의 판단대로 행동하지 않는다.** 충돌한 출처, 관련 범위, 예상 영향, 판단이 필요한 선택지를 기록하고 사람의 결정을 받은 뒤 작업을 재개한다.

`NEEDS_HUMAN`을 선언할 때는 다음 정보를 남긴다.

1. 충돌한 문서·Issue의 링크와 해당 섹션
2. 충돌하는 주장 또는 요구사항의 요약
3. 영향을 받는 구현·검증 범위
4. 사람에게 요청하는 구체적인 판단

해결되지 않은 충돌과 출처가 없는 결정은 `TBD`로 기록한다. 원본을 변경한 경우에는 영향을 받는 Issue·참고 문서·구현의 갱신 여부를 확인한다.

> `NEEDS_HUMAN`은 충돌을 발견했지만 AI가 진행을 멈추고 사람의 결정을 기다리는 상태를 뜻한다. 단순한 정보 부족이나 탐색 부족을 충돌로 간주하지 않는다.

## 3.1 충돌 처리 예시

```text
참고 문서 ↔ SSOT       → SSOT 우선, 참고 문서 정합성 갱신
Issue ↔ SSOT            → NEEDS_HUMAN, 사람의 판단 전 작업 중지
SSOT ↔ SSOT             → NEEDS_HUMAN, 사람의 판단 전 작업 중지
```

실제 충돌을 발견하면 위 상태와 근거를 작업 Issue 또는 변경 기록에 남긴다.

## 3.2 충돌 처리 의사코드

```text
if conflict(reference_document, SSOT):
    follow(SSOT)
    record(reference_document_update_if_needed)
else if conflict(Issue, SSOT) or conflict(SSOT, SSOT):
    declare(NEEDS_HUMAN)
    record(sources, conflict, impact, decision_needed)
    stop_affected_work()
else:
    proceed_using_applicable_source()
```

AI가 독자적으로 충돌을 해소하거나, `NEEDS_HUMAN` 상태를 생략하고 구현을 진행해서는 안 된다.

## 3.3 SSOT 보호정책

SSOT는 임의의 구현 참고 문서가 아니라 프로젝트의 권위 있는 원본이다. 따라서 SSOT의 규칙과 권위가 무단으로 변경되지 않도록 다음 보호정책을 적용한다.

- SSOT의 내용을 변경할 수 있는 주체는 **명시적으로 권한을 부여받은 사람**으로 제한한다.
- AI는 SSOT를 임의로 수정하거나, 충돌을 피하기 위해 SSOT의 내용을 우회·완화·재해석하지 않는다.
- AI가 SSOT 변경의 필요성을 발견하면 변경안을 제안하고, 변경 대상·이유·영향 범위·충돌 여부를 사람에게 설명한 뒤 승인을 요청한다.
- 사람의 명시적인 승인 없이 AI는 SSOT의 규칙, 우선순위, 권위 범위를 변경하지 않는다.
- 승인된 변경이라도 기존 원본, Issue, 구현, 검증에 미치는 영향을 확인하고 변경 근거를 기록한다.
- 보호정책 자체와 SSOT의 다른 규칙이 충돌하면 AI는 어느 쪽도 임의로 우선하지 않고 `NEEDS_HUMAN`을 선언한다.

```text
SSOT 변경 필요 발견
  → AI가 변경안·이유·영향 범위 제시
  → 권한 있는 사람의 명시적 승인
  → 승인된 범위만 변경
  → 관련 Issue·구현·검증 추적
```

## 4. 재고 도메인 계약

재고 도메인의 상세 정의와 수치 기준은 [`docs/01-requirements.md`](../01-requirements.md)를 원본으로 한다. 이 SSOT는 해당 문서를 요약하거나 재정의하지 않는다.

- 요구사항 ID(`F1`~`F11`)와 완료 기준(`DoD`)은 원본 문서의 식별자를 유지한다.
- 로트, 거점, 이동, 유통기한, 팝업, 사유 코드, 재고 조정 등 업무 의미의 변경은 요구사항 원본에서 먼저 결정한다.
- 요구사항 문서에 없는 업무 규칙은 이 문서에서 새로 만들지 않는다.

## 5. 아키텍처 계약

아키텍처의 상세 정의와 기술적 선택은 [`docs/06-architecture.md`](../06-architecture.md)를 원본으로 한다.

- 기술 스택·구조·데이터 흐름·핵심 로직의 변경은 아키텍처 원본에서 먼저 결정한다.
- 실제 구현 상태와 계획이 다를 때는 아키텍처 문서를 현재 구현으로 간주하지 않는다. 구현 상태는 해당 Issue와 별도 현황 문서를 함께 확인한다.
- DB 스키마나 소스 코드 자체를 이 문서에 복제하지 않는다.

## 6. SSOT 보호 경로 및 승인 정책

<!-- HARNESS:PROTECTED-PATHS:START -->

보호 경로는 SSOT와 검증 경로의 권위를 변경할 수 있는 파일이다. 보호 경로를 변경하려면 변경을 포함하는 커밋 메시지에 다음 trailer를 반드시 포함해야 한다.

```text
SSOT-Approved-By: <사람 이름 또는 계정>
```

- `<사람 이름 또는 계정>`은 비어 있지 않은 실제 사람의 이름 또는 계정이어야 한다.
- `AI`, `Claude`, `Assistant` 등 AI를 나타내는 값은 승인으로 인정하지 않는다.
- 커밋 작성자·커미터·브랜치·Issue·PR 설명·환경변수만으로는 승인을 인정하지 않는다.
- 보호 경로를 변경하는 커밋마다 trailer가 있어야 한다. 보호 경로의 미커밋 변경도 승인 trailer를 연결할 수 없으므로 실패한다.
- 로컬과 CI는 동일한 `npm run check:protected` 검사기를 사용한다. CI는 `SSOT_VERIFY_BASE`에 PR 대상 기준 커밋을 전달하고, 로컬은 기본적으로 `origin/main`(없으면 `HEAD^`)과 현재 HEAD를 비교한다.
- 검사 결과가 승인되지 않으면 `NEEDS_HUMAN` 상태를 선언하고, 사람의 승인 전에는 영향을 받는 검증을 진행하지 않는다.

검사 대상 보호 경로:

```text
- docs/harness/01-ssot.md
- docs/01-requirements.md
- docs/06-architecture.md
- scripts/verify.ts
- scripts/prepare.ts
- scripts/check-architecture.ts
- scripts/check-protected.ts
- package.json
- .github/workflows/verify.yml
```

승인된 변경은 다음처럼 커밋한다.

```bash
git commit -m "docs: update SSOT policy" -m "SSOT-Approved-By: <human name or handle>"
```

그 뒤 로컬에서는 다음을 실행한다.

```bash
npm run check:protected
```

CI에서는 `SSOT_VERIFY_BASE`를 PR 대상 브랜치의 기준 커밋 SHA로 설정한 뒤 같은 명령을 실행한다. 기준 커밋 이후 보호 경로를 변경한 모든 커밋에 유효한 trailer가 있어야 통과한다.

<!-- HARNESS:PROTECTED-PATHS:END -->

## 7. 검증 규칙

<!-- HARNESS:VERIFICATION-RULES:START -->

**상태: 구현됨**

검증 실행 영역은 `scripts/verify/`로 관리할 예정이며, 현재 실행 진입점은 [`scripts/verify.ts`](../../scripts/verify.ts)다. `npm run verify`는 보호 경로 승인 여부를 먼저 확인한 뒤 검증용 DB를 준비하고 다음 순서로 실행한다.

```text
Protected → Prepare → Types → Lint → Architecture Check → Test → Build
```

현재 검증 스크립트:

- [`scripts/verify.ts`](../../scripts/verify.ts) — 전체 검증 순서 조정
- [`scripts/prepare.ts`](../../scripts/prepare.ts) — 동일한 검증용 SQLite 시드 상태 준비
- [`scripts/check-architecture.ts`](../../scripts/check-architecture.ts) — 아키텍처 경로 규칙 검사
- [`scripts/check-protected.ts`](../../scripts/check-protected.ts) — 보호 경로 및 사람 승인 trailer 검사

보호 경로 검사만 실행하려면 `npm run check:protected`를 사용한다.

실행 명령은 `npm run verify`이며, 각 단계가 실패하면 이후 단계는 실행하지 않는다. 검증 규칙과 실행 기준은 권위 있는 [`docs/harness/02-verification.md`](./02-verification.md)를 따른다. 검증 대상의 도메인·아키텍처 근거는 [`docs/01-requirements.md`](../01-requirements.md)와 [`docs/06-architecture.md`](../06-architecture.md)를 따른다.

단, 현재 저장소에는 `scripts/verify/` 디렉터리 자체는 없고 검증 실행 스크립트는 `scripts/` 루트에 있다. 향후 검증 스크립트를 디렉터리로 이동할 때는 이 경로와 `package.json`의 명령을 함께 갱신한다.

<!-- HARNESS:VERIFICATION-RULES:END -->

## 8. 구현·검증 루프

<!-- HARNESS:IMPLEMENTATION-VERIFICATION-LOOP:START -->

**상태: 구현됨**

유지보수 작업은 GitHub Issue의 6개 항목을 기준으로 진행한다. Issue의 `6. 구현 루프 최대 횟수` 기본값은 3회다.

```text
원본 라우팅 확인
  → 구현 1회
  → Issue 종료 조건에 연결된 테스트·검증 실행
  → 통과하면 종료
  → 실패하면 원인 기록·수정 후 다음 루프
```

- 한 루프는 구현 시도 1회와 그 결과를 판정하는 검증 실행 1회로 구성한다.
- 기능별 종료 조건 테스트는 `tests/issues/issue-{Issue 번호}-{기능명}.test.ts`에 둔다.
- 기본 3회 안에 모든 종료 조건을 통과하지 못하면 AI는 반복을 멈추고 `NEEDS_HUMAN`을 선언한다.
- `NEEDS_HUMAN`에는 시도 횟수, 변경 요약, 실패한 명령과 출력, 남은 판단 사항을 기록한다.
- 사람의 명시적 지시 없이 최대 횟수를 늘리거나 루프를 계속하지 않는다.

<!-- HARNESS:IMPLEMENTATION-VERIFICATION-LOOP:END -->

## 9. 추적성과 변경 규칙

개별 변경은 다음 연결을 남기는 것을 원칙으로 한다.

```text
GitHub Issue → 요구사항/아키텍처 원본 → 구현 변경 → 검증 규칙 문서 → 테스트·검증 결과
```

- 작업 브랜치, 커밋, PR은 해당 Issue를 참조한다.
- Issue의 수락 기준은 가능하면 요구사항 ID 또는 아키텍처 섹션을 링크한다.
- 원본 문서의 규칙을 바꾸는 변경은 그 문서와 변경 Issue를 함께 갱신한다.
- 검증 규칙과 실행 기준은 [`docs/harness/02-verification.md`](./02-verification.md)를 따른다.
- 출처가 확인되지 않은 외부 요구사항, 독립 QA 결과서, 운영 절차를 현재 SSOT라고 표시하지 않는다.

## 10. 현재 미정 사항

다음 영역은 현재 이 저장소에서 Harness 원본으로 지정하지 않는다.

- 외부 고객·현업 요구사항의 원문 및 승인 기록
- 독립적인 QA 실행 결과서와 요구사항 추적성 매트릭스
- 배포·백업·장애 대응을 포함한 운영 runbook

이 목록에 있는 내용이 필요해지면 먼저 해당 작업의 GitHub Issue를 만들고, 새로운 원본을 명시한 뒤 이 SSOT의 레지스트리와 링크를 갱신한다.

다음 영역은 현재 이 저장소에서 Harness 원본으로 지정하지 않는다.

- 외부 고객·현업 요구사항의 원문 및 승인 기록
- 독립적인 QA 실행 결과서와 요구사항 추적성 매트릭스
- 배포·백업·장애 대응을 포함한 운영 runbook
- 검증 규칙 스크립트와 구현·검증 루프

이 목록에 있는 내용이 필요해지면 먼저 해당 작업의 GitHub Issue를 만들고, 새로운 원본을 명시한 뒤 이 SSOT의 레지스트리와 링크를 갱신한다.
