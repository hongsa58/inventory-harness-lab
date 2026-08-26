/**
 * 검증 시작 전 로컬 DB를 동일한 시드 상태로 되돌린다.
 *
 * 검증이 이전 개발·테스트 실행 결과에 영향을 받지 않도록
 * SQLite 데이터베이스와 WAL/Journal 파일을 삭제한 뒤 db:ensure를 실행한다.
 */
import { existsSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import 'dotenv/config'

const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
if (!url.startsWith('file:')) {
  throw new Error(`Prepare는 SQLite file: DATABASE_URL만 지원합니다: ${url}`)
}

const dbPath = path.resolve(process.cwd(), url.slice('file:'.length).split('?')[0])
const databaseFiles = [
  dbPath,
  `${dbPath}-journal`,
  `${dbPath}-wal`,
  `${dbPath}-shm`,
]

for (const file of databaseFiles) {
  if (existsSync(file)) rmSync(file, { force: true })
}

console.log('\n▸ 검증용 데이터베이스를 초기화하고 동일한 시드를 주입합니다\n')
execSync('npm run db:ensure', { stdio: 'inherit' })
