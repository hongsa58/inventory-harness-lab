/**
 * SSOT 보호 경로 변경에 명시적인 사람의 범위 승인이 있는지 검사한다.
 * 로컬과 CI는 동일한 검사기를 사용하며, 승인 범위는 외부의 신뢰된 입력으로만 전달한다.
 */
import { execFileSync } from 'node:child_process'
import {
  canonicalPath,
  parseAuthorizationScope,
  validateAuthorizationScope,
} from './protected-policy'

const root = process.cwd()
const ssotRelativePath = 'docs/harness/01-ssot.md'
const markerStart = '<!-- HARNESS:PROTECTED-PATHS:START -->'
const markerEnd = '<!-- HARNESS:PROTECTED-PATHS:END -->'
const authorizationVariable = 'SSOT_APPROVED_PATHS'

export { canonicalPath, parseAuthorizationScope, validateAuthorizationScope }
export type { ScopeValidation } from './protected-policy'

export function parseProtectedPaths(document: string): string[] {
  const start = document.indexOf(markerStart)
  const end = document.indexOf(markerEnd, start + markerStart.length)
  if (start < 0 || end < 0) throw new Error('SSOT protected-path registry is missing')
  const block = document.slice(start + markerStart.length, end)
  const listStart = block.indexOf('검사 대상 보호 경로:')
  if (listStart < 0) throw new Error('SSOT protected-path list is missing')
  return block
    .slice(listStart)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
}

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' })
}

function tryGit(args: string[]): string | null {
  try {
    return git(args)
  } catch {
    return null
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort()
}

function namesFromDiff(args: string[]): string[] {
  return git(args)
    .split(/\r?\n/)
    .map((line) => line.trim().replaceAll('\\', '/'))
    .filter(Boolean)
}

function baseForCheck(): string {
  const configured = process.env.SSOT_VERIFY_BASE?.trim()
  if (configured) return configured
  return tryGit(['rev-parse', '--verify', 'origin/main'])?.trim() ?? 'HEAD^'
}

const base = baseForCheck()
const registryDocument = tryGit(['show', `${base}:${ssotRelativePath}`])
if (!registryDocument) throw new Error(`cannot read protected-path registry from trusted base ${base}`)
const parsedPaths = parseProtectedPaths(registryDocument).map(canonicalPath)
if (parsedPaths.some((entry) => entry === null)) throw new Error('protected-path registry contains an invalid path')
const registry = unique(parsedPaths as string[])
const pathspec = ['--', ...registry]
const committed = namesFromDiff(['diff', '--name-only', `${base}...HEAD`, ...pathspec])
const staged = namesFromDiff(['diff', '--cached', '--name-only', ...pathspec])
const unstaged = namesFromDiff(['diff', '--name-only', ...pathspec])
const untracked = namesFromDiff(['ls-files', '--others', '--exclude-standard', ...pathspec])
const changed = unique([...committed, ...staged, ...unstaged, ...untracked])

if (changed.length === 0) {
  console.log('Protected checks passed: no protected paths changed.')
  process.exit(0)
}

const approved = parseAuthorizationScope(process.env[authorizationVariable])
const scope = validateAuthorizationScope(changed, approved, registry)
const uncommitted = unique([...staged, ...unstaged, ...untracked])
if (uncommitted.length > 0 || scope.outOfScope.length > 0 || scope.invalid.length > 0 || approved.length === 0) {
  console.error('NEEDS_HUMAN: protected paths changed without explicit scoped human authorization.')
  console.error(`Changed protected paths: ${changed.join(', ')}`)
  console.error(`Authorized scope: ${scope.authorized.join(', ') || '(none)'}`)
  if (scope.outOfScope.length > 0) console.error(`Out-of-scope paths: ${scope.outOfScope.join(', ')}`)
  if (scope.invalid.length > 0) console.error(`Invalid authorized paths: ${scope.invalid.join(', ')}`)
  if (uncommitted.length > 0) console.error(`Uncommitted protected paths: ${uncommitted.join(', ')}`)
  console.error(`Set ${authorizationVariable} only from a trusted explicit human instruction.`)
  process.exitCode = 1
} else {
  console.log(`Protected checks passed: ${changed.length} protected path(s) explicitly authorized.`)
}
