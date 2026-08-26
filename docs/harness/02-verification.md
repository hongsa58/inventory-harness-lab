# Harness Verification

> 상태: 구현됨 · 최종 갱신: 2026-08-26

이 문서는 현재 저장소에서 변경사항을 검증하는 실행 계약이며, 검증 규칙의 권위 있는 원본이다. [`01-ssot.md`](./01-ssot.md)는 이 문서의 위치와 권위를 등록하고, 도메인·아키텍처 원본은 검증 대상 규칙의 근거를 제공한다. 검증 스크립트는 이 문서에 정의된 규칙을 실행할 뿐 규칙 자체를 대체하지 않는다.

## 1. 검증 진입점

표준 검증 명령은 다음 하나다.

```bash
npm run verify
```

`npm run verify`는 첫 실패에서 중단되며, 현재 순서는 다음과 같다.

```text
Protected → Prepare → Types → Lint → Architecture Check → Test → Build
```

각 단계는 이전 단계가 성공한 경우에만 실행한다.

## 2. 단계별 계약

### 2.1 Protected

```bash
npm run check:protected
```

[`scripts/check-protected.ts`](../../scripts/check-protected.ts)가 [`01-ssot.md`](./01-ssot.md)의 보호 경로를 읽고 변경 여부를 검사한다.

- 보호 경로 변경에는 `SSOT-Approved-By: <사람 이름 또는 계정>` commit trailer가 필요하다.
- 보호 경로를 승인 없이 변경하면 `NEEDS_HUMAN`을 출력하고 실패한다.
- 로컬과 CI는 동일한 검사기를 사용한다.
- CI는 `SSOT_VERIFY_BASE`에 PR base 또는 push 이전 커밋 SHA를 설정한다.
- 보호 경로가 변경되지 않았으면 성공한다.

승인 정책과 보호 경로 목록은 [`01-ssot.md`](./01-ssot.md)를 수정하지 않고 이 문서에 복제하지 않는다.

### 2.2 Prepare

```bash
npx tsx scripts/prepare.ts
```

검증 전용 SQLite DB를 매번 초기화하고 동일한 시드 데이터를 주입한다.

```text
DATABASE_URL=file:./prisma/verify.db
```

- 개발용 `prisma/dev.db`와 분리한다.
- 기존 verification DB 및 `-journal`, `-wal`, `-shm` 파일을 제거한다.
- migration, Prisma Client 생성, seed를 실행한다.
- 이전 로컬 개발·테스트 상태가 검증 결과에 영향을 주지 않게 한다.

### 2.3 Types

```bash
npx tsc --noEmit
```

`tsconfig.json`의 strict TypeScript 설정을 기준으로 타입 오류가 없어야 한다. 별도의 `typecheck` npm script는 없으므로 `verify`가 직접 `npx tsc --noEmit`을 실행한다.

### 2.4 Lint

```bash
npm run lint
```

Next.js Core Web Vitals 및 TypeScript ESLint 설정을 실행한다. 오류가 없어야 한다.

### 2.5 Architecture Check

```bash
npm run check:architecture
```

[`scripts/check-architecture.ts`](../../scripts/check-architecture.ts)가 production `src` 경계를 정적으로 검사한다.

현재 검사 계약:

- Lot mutation은 `src/lib/stock.ts`의 `applyMovement()` 경로에서만 허용한다.
- production source에서 Movement 삭제를 금지한다. 취소는 `reverseMovement()`를 사용한다.
- components의 Prisma/database 직접 접근을 금지한다.
- `src/proxy.ts`에서 DB·auth·generated Prisma·Server Action import를 금지한다.
- Server Action은 `'use server'` 지시문을 가져야 한다.
- `applyMovement()`를 호출하는 Server Action은 `$transaction`을 사용해야 한다.

검사기는 DB를 열지 않으며, 위반 시 파일·행·규칙 ID를 출력하고 종료 코드 1을 반환한다.

### 2.6 Test

```bash
npm test
```

Vitest가 `tests/**/*.test.ts`를 Node 환경에서 실행한다. 현재 테스트는 FEFO/LEFO, 재고 불변식·롤백·취소, 팝업 누적 정산을 검증한다.

각 유지보수 Issue의 종료 조건을 검증하는 테스트는 다음 경로 규칙을 따른다.

```text
tests/issues/issue-{Issue 번호}-{기능명}.test.ts
```

예:

```text
tests/issues/issue-42-fefo-outbound.test.ts
```

Issue 테스트 작성 규칙:

- 파일명에 실제 GitHub Issue 번호와 기능명을 넣는다.
- 각 테스트는 Issue의 종료 조건에 적힌 입력·기준·기대 결과·실패 기준을 직접 판정한다.
- 테스트 설명(`describe`/`it`)에 종료 조건의 식별 가능한 요약을 포함한다.
- 종료 조건과 테스트 케이스를 연결하는 주석 또는 테스트 설명을 남긴다.
- 공용 DB를 사용하는 테스트라면 기존 `tests/helpers.ts`와 cleanup 규칙을 따른다.
- DB와 무관한 검증은 공용 DB를 사용하지 않는다.
- 단일 Issue 테스트는 다음 명령으로 실행한다.

```bash
npx vitest run tests/issues/issue-42-fefo-outbound.test.ts
```

- 전체 `npm test` 실행 시 `tests/**/*.test.ts` 규칙에 따라 Issue 테스트도 함께 실행된다.

단일 파일 검증:

```bash
npx vitest run tests/fefo.test.ts
npx vitest run tests/stock-invariant.test.ts
npx vitest run tests/popup-settle.test.ts
```

테스트 이름 필터:

```bash
npx vitest run tests/fefo.test.ts -t "키워드"
```

테스트 DB는 `prisma/verify.db`를 사용한다. Vitest 설정은 파일 병렬 실행을 끄며, 테스트는 공용 DB fixture를 사용하므로 테스트 외부에서 DB를 삭제하거나 병렬로 변경하지 않는다.

### 2.7 Build

```bash
npm run build
```

`prisma generate && next build`를 실행한다. Prisma Client 생성과 Next.js production build가 모두 성공해야 한다.

## 3. 실행기와 원본 위치

| 역할 | 실행 파일 | 권위 또는 입력 |
|---|---|---|
| 전체 순서 | [`scripts/verify.ts`](../../scripts/verify.ts) | 실행 순서와 중단 동작 |
| 보호 경로 | [`scripts/check-protected.ts`](../../scripts/check-protected.ts) | [`01-ssot.md`](./01-ssot.md) 보호 경로 블록 |
| 검증 DB 준비 | [`scripts/prepare.ts`](../../scripts/prepare.ts) | Prisma migration + `prisma/seed.ts` |
| 아키텍처 경계 | [`scripts/check-architecture.ts`](../../scripts/check-architecture.ts) | [`docs/06-architecture.md`](../06-architecture.md) |
| 타입 | `npx tsc --noEmit` | `tsconfig.json` |
| 린트 | `npm run lint` | `eslint.config.mjs` |
| 테스트 | `npm test` | `vitest.config.ts`, `tests/` |
| 빌드 | `npm run build` | `package.json`, Next.js 설정 |

검증 명령의 npm 등록은 [`package.json`](../../package.json)에서 확인한다.

## 4. 로컬과 CI

### 로컬

```bash
npm ci
npm run verify
```

환경 파일은 `.env.example`을 바탕으로 준비한다. `verify`는 검증 DB를 별도로 사용하므로 개발 DB 상태와 분리된다.

### GitHub Actions

[`.github/workflows/verify.yml`](../../.github/workflows/verify.yml)은 다음 이벤트에서 `npm run verify`를 실행한다.

- `main` 대상 Pull Request
- `main`에 대한 push

Workflow는 전체 Git 이력을 checkout하고 `SSOT_VERIFY_BASE`를 설정한 뒤 동일한 `npm run verify`를 실행한다. CI와 로컬의 검증 단계 및 보호 경로 판정은 동일한 실행기를 사용한다.

## 5. 보조 검증 명령

전체 검증 외에 상태를 좁혀 확인할 때 다음 명령을 사용할 수 있다.

```bash
npx prisma validate
npx prisma generate
npm run db:ensure
npx tsx scripts/verify-m1.ts
npx tsx scripts/verify-headline.ts
npx tsx scripts/snapshot.ts
```

보조 스크립트는 전체 검증 순서를 대체하지 않는다. DB 상태를 읽는 보조 스크립트는 실행 전에 대상 DB가 준비되어 있어야 한다.

## 6. 성공 기준과 실패 처리

전체 검증 성공 조건:

- Protected가 성공하거나 보호 경로 변경이 없음
- 검증용 DB 준비 성공
- TypeScript 오류 없음
- ESLint 오류 없음
- Architecture Check 위반 없음
- 모든 Vitest 테스트 통과
- Next.js production build 성공

어느 단계라도 실패하면 `npm run verify`는 0이 아닌 종료 코드로 종료하고 이후 단계는 실행하지 않는다. 실패 보고에는 단계명과 원본 명령의 출력을 남긴다.

Protected가 `NEEDS_HUMAN`을 출력하면 AI가 보호 정책을 임의로 우회하지 않는다. [`01-ssot.md`](./01-ssot.md)의 승인 절차에 따라 사람이 commit trailer를 추가하거나 판단을 제공한 뒤 다시 검증한다.

## 7. 구현·검증 루프 제한

Issue의 `6. 구현 루프 최대 횟수`는 기본값 **3회**이며, AI가 다음 사이클을 반복할 수 있는 최대 횟수다.

```text
구현 시도 1회 → 검증 실행 → 실패 시 원인 분석·수정 → 다음 사이클
```

- 한 사이클에는 구현 변경과 그 변경에 대한 검증 실행이 포함된다.
- 단순히 같은 검증 명령만 반복 실행하는 횟수를 뜻하지 않는다.
- Issue에 적힌 최대 횟수를 초과해 AI가 자동으로 계속 수정·재실행해서는 안 된다.
- 최대 횟수 안에 모든 종료 조건을 통과하지 못하면 즉시 반복을 멈추고 `NEEDS_HUMAN` 상태를 선언한다.
- 사람에게 전달할 때는 시도 횟수, 각 시도의 변경 요약, 실패한 검증 명령과 출력, 남은 판단 사항을 기록한다.
- 기본값은 3회다. 별도 승인 없이 3회를 초과할 수 없다.
- 최대 횟수가 비어 있거나 숫자가 아니거나 0 이하이면 작업을 시작하지 않고 사람에게 값을 요청한다.

예:

```text
구현 루프 최대 횟수: 3
1회차 — 구현 후 npm run verify 실패: Lint 1건
2회차 — 수정 후 npm run verify 실패: Issue 테스트 1건
3회차 — 수정 후 npm run verify 실패: Build 오류
→ 추가 자동 반복 금지, NEEDS_HUMAN으로 전환
```

`NEEDS_HUMAN` 이후에는 사람이 최대 횟수를 늘리거나 다음 조치를 지시하기 전까지 AI가 해당 작업을 재시도하지 않는다.
