# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 작업 시작 시 문서 읽기

문서 전체를 한꺼번에 읽지 않는다. 문서 종류별 원본과 탐색 순서는 [`AGENTS.md`](AGENTS.md)에 정의되어 있으므로, 먼저 그 라우팅을 따른다. 일반적인 구현 재개라면 [`docs/HANDOVER.md`](docs/HANDOVER.md)를 먼저 읽고, 도메인 규칙은 [`docs/01-requirements.md`](docs/01-requirements.md), 기술 구조와 불변식은 [`docs/06-architecture.md`](docs/06-architecture.md)에서 확인한다. 해당 문서만으로 판단할 수 없을 때 관련 시나리오·디자인·계획 문서와 소스를 추가로 탐색한다.

문서 권위와 충돌 처리 규칙은 [`docs/harness/01-ssot.md`](docs/harness/01-ssot.md)를 따른다. 근거 없는 결정을 만들지 말고, 충돌이 해결되지 않으면 `TBD`로 남긴다.

## 프로젝트 개요

유통기한별 로트 재고를 자사 창고, 풀필먼트, 배송 중, 팝업 등의 거점으로 추적하는 모바일 우선 사내 재고관리 PoC다. 스택은 Next.js 16 App Router, React 19, TypeScript, Prisma 7, SQLite, Tailwind CSS 4, Vitest다.

현재 구현은 M1~M6(인증, 조회, 입출고, 풀필먼트 이동·반영, 팝업 정산)까지 완료되어 있다. 다음 작업은 M7이며 `/expiry`, `/history`, `/settings`, 재고 조정·폐기 및 최종 QA가 남아 있다. 상세 현황과 구현 중 결정은 `docs/HANDOVER.md`를 우선한다.

## 개발 환경 및 명령

```bash
npm install
cp .env.example .env       # DATABASE_URL과 긴 SESSION_SECRET 설정
npm run dev                 # db:ensure 후 Next 개발 서버, http://localhost:3000
npm run build               # Prisma client 생성 후 프로덕션 빌드
npm start                   # 빌드된 서버 실행
npm run lint                # ESLint
npm test                    # tests/**/*.test.ts 전체 실행
npx vitest run tests/fefo.test.ts       # 단일 테스트 파일
npx vitest run tests/fefo.test.ts -t "키워드"  # 이름으로 일부 테스트
npm run db:ensure           # DB가 없을 때 migration + generate + seed
npm run db:migrate          # Prisma 개발 migration
npm run db:studio           # Prisma Studio (기본 localhost:5555)
npm run seed                # 목업 데이터 시드
npm run seed:reset          # SQLite 파일 삭제 후 DB 재생성·시드
```

`npm run dev`는 `scripts/ensure-db.ts`를 먼저 실행해 `prisma/dev.db`가 없으면 migration, Prisma generate, seed를 수행한다. DB 파일은 커밋하지 않는다. `seed:reset`은 로컬 데이터를 삭제하는 명령이며, `package.json` 스크립트의 `rm` 때문에 Windows에서는 Git Bash/WSL 환경을 사용한다. 시드 계정은 `warehouse@demo.kr`와 `sales@demo.kr`, 비밀번호는 둘 다 `demo1234`다.

Vitest는 `prisma/dev.db`를 공유하고 파일 병렬 실행을 끈 설정이다. 새 테스트는 `tests/helpers.ts`와 기존 테스트의 방식처럼 자신이 만든 데이터만 정리하며, 공유 DB를 전역으로 초기화하지 않는다.

## 아키텍처와 구현 계약

```text
Server Component (src/app)
        ↓ 읽기                 ↓ 쓰기
  src/lib/inventory       src/actions/* (Server Actions)
        └────────────── db.$transaction() ──────────────┐
                                                        ↓
                           src/lib/stock.applyMovement()
                                                        ↓
                         Prisma 7 adapter → SQLite
```

- `src/app/**/page.tsx`는 화면과 서버 조회를 담당한다. API route나 전역 상태관리 라이브러리는 사용하지 않는다.
- 모든 쓰기는 도메인별 `src/actions/*.ts` Server Action에서 시작하고, DB 쓰기는 트랜잭션으로 묶는다.
- **재고 수량을 바꾸는 유일한 통로는 `src/lib/stock.ts`의 `applyMovement()`다.** 화면·액션·시드는 `lot.update()`를 직접 호출하지 않는다. 이 함수는 출발 Lot 차감, 도착 Lot upsert, 불변 `Movement` 원장 기록을 원자적으로 처리하고 음수 재고를 거부한다.
- 재고의 최소 단위는 `상품 × 거점 × 유통기한` Lot이다. `Lot.quantity`는 현재 수량이고 `Movement`가 이동·감사 원장이다. 재고를 삭제하지 않고 `fromLocationId → toLocationId` 이동으로 표현한다. 취소는 삭제가 아니라 `reverseMovement()`의 방향 반전 상쇄 기록이다.
- `src/lib/fefo.ts`의 순수 `planAllocation()`과 서버용 `allocateLots()`를 재사용한다. 일반 출고, 풀필먼트 일일 반영, 팝업 반출, 폐기는 FEFO(빠른 유통기한 우선), 자사 창고에서 풀필먼트로 보내는 발송만 LEFO(넉넉한 유통기한 우선)다.
- 날짜만 의미하는 유통기한은 `src/lib/date.ts`의 `dateOnly()`를 거쳐 UTC 자정으로 정규화한다. 수량은 DB에 정수로 저장하며 단위는 `Product.unit`과 화면 컴포넌트에서 처리한다.
- 인증은 `src/lib/session.ts`의 JWT 쿠키 검증과 `src/lib/auth.ts`의 DB 사용자 검증으로 나뉜다. Next.js 16의 진입점은 `src/proxy.ts`이며, Prisma를 사용하는 `auth.ts`를 proxy에서 import하지 않는다.
- Prisma 설정은 `prisma.config.ts`, 스키마·migration·시드는 `prisma/`에 있다. Prisma 7 생성 클라이언트는 `@/generated/prisma/client` 경로와 SQLite 드라이버 adapter를 사용한다.

## 변경 시 확인할 위치

- 재고 의미·사유 코드·기능 요구사항: `docs/01-requirements.md`
- 데이터 모델·트랜잭션·FEFO/LEFO·인증: `docs/06-architecture.md`
- 현재 완료/미완료 및 재개 지점: `docs/HANDOVER.md`
- 화면/반응형/접근성: `docs/05-design.md`
- 업무 흐름: `docs/03-scenarios.md`
- 마일스톤·QA: `docs/07-plan.md`
- 구현: `src/app`, `src/actions`, `src/lib`, `src/components`
- 검증: `tests/` 및 `scripts/verify-*.ts`

새 기능을 추가하기 전에는 `AGENTS.md`의 해당 라우팅 행에 따라 원본을 읽고, 기존 구현·테스트와 현재 상태를 대조한다. 요구사항 또는 아키텍처 원본을 바꾸는 작업은 `docs/harness/01-ssot.md`의 Issue → 원본 → 구현 → 검증 추적 규칙도 따른다.
