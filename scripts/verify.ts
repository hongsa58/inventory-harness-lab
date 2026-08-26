/**
 * 동일한 임시 SQLite 시드 상태에서 검증 단계를 순서대로 실행한다.
 * 개발용 prisma/dev.db를 사용하지 않아 로컬 작업 상태와 격리된다.
 */
import { spawnSync } from 'node:child_process'

const env = {
  ...process.env,
  DATABASE_URL: 'file:./prisma/verify.db',
}

const run = (command: string, args: string[]) => {
  const result = spawnSync(command, args, { stdio: 'inherit', env, shell: process.platform === 'win32' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run('npm', ['run', 'check:protected'])
run('npx', ['tsx', 'scripts/prepare.ts'])
run('npx', ['tsc', '--noEmit'])
run('npm', ['run', 'lint'])
run('npm', ['run', 'check:architecture'])
run('npm', ['test'])
run('npm', ['run', 'build'])
