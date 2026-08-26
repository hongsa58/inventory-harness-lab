# AGENTS.md

이 파일은 저장소 문서 탐색 규칙이다. 작업을 시작할 때 모든 문서를 일괄적으로 읽지 않는다. 먼저 아래 라우팅으로 작업에 직접 필요한 원본만 읽고, 그 문서로 판단할 수 없을 때만 참고 문서와 코드를 단계적으로 넓혀 읽는다.

## 기본 탐색 순서

1. 이 파일의 라우팅 표에서 질문·작업 유형을 고른다.
2. 해당 행의 **원본 문서**를 먼저 읽는다.
3. 현재 구현 상태가 필요하면 `docs/HANDOVER.md`를 추가로 읽는다.
4. 구현 위치와 실제 동작은 관련 소스와 테스트에서 확인한다.
5. 문서 간 충돌이나 근거 부족이 있으면 추측하지 말고 `docs/harness/01-ssot.md`의 우선순위와 TBD 규칙을 따른다.

`docs/harness/01-ssot.md`는 문서의 권위와 변경 추적 규칙을 안내하는 메타 문서다. 업무 규칙이나 아키텍처 내용을 대신 정의하지 않는다.

## 질문·작업 유형별 라우팅

| 질문 또는 작업 | 먼저 읽을 원본 | 필요할 때만 넓혀 읽을 문서 |
|---|---|---|
| 재고 의미, 로트, 거점, 이동, 사유 코드, 기능 요구사항, 범위, 완료 기준 | [`docs/01-requirements.md`](docs/01-requirements.md) | `docs/03-scenarios.md`, 관련 `src/lib`·`src/actions`·테스트 |
| 기술 스택, 폴더 책임, 데이터 모델, 트랜잭션, FEFO/LEFO, 인증 구조 | [`docs/06-architecture.md`](docs/06-architecture.md) | `prisma/schema.prisma`, 관련 `src/lib`, `src/actions`, `src/proxy.ts`, 테스트 |
| 현재 구현 상태, 남은 일, 이미 확인한 동작, 재개 작업 | [`docs/HANDOVER.md`](docs/HANDOVER.md) | `docs/07-plan.md`, 현재 소스와 테스트 |
| 마일스톤, 구현 순서, QA 체크리스트 | [`docs/07-plan.md`](docs/07-plan.md) | `docs/HANDOVER.md`, 해당 요구사항·아키텍처 원본 |
| 화면 구조, 상호작용, 반응형, 색상, 접근성 | [`docs/05-design.md`](docs/05-design.md) | `docs/03-scenarios.md`, 관련 `src/app`·`src/components` |
| 사용자 역할, 사용 맥락, 설계 긴장점 | [`docs/02-personas.md`](docs/02-personas.md) | `docs/03-scenarios.md`, `docs/05-design.md` |
| 사용자 업무 흐름·시나리오·설계 원칙 | [`docs/03-scenarios.md`](docs/03-scenarios.md) | `docs/01-requirements.md`, `docs/05-design.md`, 관련 화면·액션 |
| 차별화 장치(입력 키패드, 오늘 할 일, 팝업 리포트) | [`docs/04-engagement.md`](docs/04-engagement.md) | `docs/05-design.md`, 관련 컴포넌트·화면 |
| 문서 권위, 충돌, Issue 연결, SSOT 변경 | [`docs/harness/01-ssot.md`](docs/harness/01-ssot.md) | 충돌한 원본 문서와 해당 Issue |
| 실행·설치·시연 명령, 계정, 기술 스택 개요 | [`README.md`](README.md) | `package.json`, `.env.example`, `docs/06-architecture.md` |

## 탐색을 넓히는 기준

- 원본 문서가 말하는 **의도**와 실제 코드의 **현재 상태**를 혼동하지 않는다.
- 원본에 없는 규칙을 새로 만들지 않는다. 결정이 필요하면 관련 Issue와 원본 변경 여부를 확인하고, 해결 전에는 `TBD`로 남긴다.
- 소스 파일을 찾을 때는 먼저 해당 도메인의 `src/app`, `src/actions`, `src/lib`, `src/components`와 `tests`만 확인한다.
- DB 변경은 `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`를 함께 확인한다.
- 검증은 관련 테스트부터 실행하고, 범위를 넓힐 때 `npm test`, `npm run lint`, `npm run build` 순으로 필요한 것만 선택한다.

## 구현 계약 요약

세부 규칙은 반드시 [`docs/06-architecture.md`](docs/06-architecture.md)와 [`docs/01-requirements.md`](docs/01-requirements.md)를 따른다. 특히 재고 수량 변경은 `src/lib/stock.ts`의 `applyMovement()`를 통해서만 수행하며, 관련 쓰기는 트랜잭션 안에서 처리한다. 이 파일에 세부 스키마나 업무 규칙을 복제하지 않는다.
