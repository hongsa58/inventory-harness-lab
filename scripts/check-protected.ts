/**
 * SSOT 보호 경로 변경에 사람 승인이 남아 있는지 검사한다.
 * 로컬 작업 트리와 CI에서 같은 Git/trailer 규칙을 사용한다.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const ssotFile = path.join(root, 'docs', 'harness', '01-ssot.md')
const markerStart = '<!-- HARNESS:PROTECTED-PATHS:START -->'
const markerEnd = '<!-- HARNESS:PROTECTED-PATHS:END -->'
const approvalTrailer = 'SSOT-Approved-By'

type ApprovalCommit = { hash: string; value: string | null }

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

function commitsTouching(protectedPaths: string[], range: string): string[] {
  const hashes = tryGit(['log', '--format=%H', range, '--', ...protectedPaths])
  return hashes ? unique(hashes.split(/\r?\n/).filter(Boolean)) : []
}

function policyCommit(base: string): string | null {
  const hashes = tryGit([
    'log',
    '--format=%H',
    '--reverse',
    `${base}..HEAD`,
    '--',
    'scripts/check-protected.ts',
  ])
  return hashes?.split(/\r?\n/).find(Boolean) ?? null
}

function approvalFor(commit: string): string | null {
  const message = git(['show', '-s', '--format=%B', commit])
  for (const line of message.split(/\r?\n/)) {
    const match = line.match(/^SSOT-Approved-By:\s*(.+?)\s*$/i)
    if (match?.[1]) return match[1]
  }
  return null
}

function isHumanApproval(value: string | null): value is string {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 && !['ai', 'claude', 'assistant', 'bot'].includes(normalized)
}

const protectedPaths = parseProtectedPaths(readFileSync(ssotFile, 'utf8'))
const base = baseForCheck()
const pathspec = ['--', ...protectedPaths]
const committed = namesFromDiff(['diff', '--name-only', `${base}...HEAD`, ...pathspec])
const staged = namesFromDiff(['diff', '--cached', '--name-only', ...pathspec])
const unstaged = namesFromDiff(['diff', '--name-only', ...pathspec])
const untracked = namesFromDiff(['ls-files', '--others', '--exclude-standard', ...pathspec])
const changed = unique([...committed, ...staged, ...unstaged, ...untracked])

if (changed.length === 0) {
  console.log('Protected checks passed: no protected paths changed.')
  process.exit(0)
}

const policy = policyCommit(base)
const approvalRange = policy ? `${policy}..HEAD` : `${base}..HEAD`
const commits: ApprovalCommit[] = commitsTouching(protectedPaths, approvalRange).map((hash) => ({
  hash,
  value: approvalFor(hash),
}))
const unapproved = commits.filter((commit) => !isHumanApproval(commit.value))
const uncommitted = unique([...staged, ...unstaged, ...untracked])

if (uncommitted.length > 0 || unapproved.length > 0) {
  console.error('NEEDS_HUMAN: protected paths changed without explicit human approval.')
  console.error(`Changed protected paths: ${changed.join(', ')}`)
  if (uncommitted.length > 0) console.error(`Uncommitted protected paths: ${uncommitted.join(', ')}`)
  if (unapproved.length > 0) console.error(`Unapproved commits: ${unapproved.map((commit) => commit.hash).join(', ')}`)
  console.error(`Add this trailer to every protected-path commit: ${approvalTrailer}: <human name or handle>`)
  process.exitCode = 1
} else {
  console.log(`Protected checks passed: ${changed.length} protected path(s) approved.`)
}
