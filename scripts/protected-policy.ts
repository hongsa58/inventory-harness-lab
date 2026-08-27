const markerStart = '<!-- HARNESS:PROTECTED-PATHS:START -->'
const markerEnd = '<!-- HARNESS:PROTECTED-PATHS:END -->'

export function parseProtectedPaths(document: string): string[] {
  const start = document.indexOf(markerStart)
  const end = document.indexOf(markerEnd, start + markerStart.length)
  if (start < 0 || end < 0) throw new Error('SSOT protected-path registry is missing')
  const block = document.slice(start + markerStart.length, end)
  const listStart = block.indexOf('검사 대상 보호 경로:')
  if (listStart < 0) throw new Error('SSOT protected-path list is missing')
  return block.slice(listStart).split(/\r?\n/).map((line) => line.trim())
    .filter((line) => line.startsWith('- ')).map((line) => line.slice(2).trim())
}

export type ScopeValidation = {
  authorized: string[]
  outOfScope: string[]
  invalid: string[]
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort()
}

export function canonicalPath(value: string): string | null {
  const normalized = value.trim().replaceAll('\\', '/')
  if (!normalized || normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) return null
  const parts = normalized.split('/')
  if (parts.some((part) => !part || part === '.' || part === '..')) return null
  return parts.join('/')
}

export function parseAuthorizationScope(value: string | undefined): string[] {
  if (!value?.trim()) return []
  const paths = value.split(/[\r\n,]+/).map(canonicalPath)
  if (paths.some((entry) => entry === null)) throw new Error('authorization scope contains an invalid path')
  return unique(paths as string[])
}

export function validateAuthorizationScope(
  changed: string[],
  approved: string[],
  protectedPaths: string[],
): ScopeValidation {
  const protectedSet = new Set(protectedPaths)
  const authorized = unique(approved)
  const invalid = authorized.filter((file) => !protectedSet.has(file))
  const outOfScope = changed.filter((file) => !authorized.includes(file))
  return { authorized, outOfScope, invalid }
}
