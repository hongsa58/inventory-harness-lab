import { describe, expect, it } from 'vitest'
import {
  canonicalPath,
  parseAuthorizationScope,
  validateAuthorizationScope,
  parseProtectedPaths,
} from '../scripts/protected-policy'

const registry = ['docs/harness/01-ssot.md', 'scripts/check-protected.ts', 'package.json']

describe('protected-path authorization scope', () => {
  it('normalizes repository-relative paths', () => {
    expect(canonicalPath('scripts\\check-protected.ts')).toBe('scripts/check-protected.ts')
    expect(canonicalPath('/scripts/check-protected.ts')).toBeNull()
    expect(canonicalPath('../package.json')).toBeNull()
    expect(canonicalPath('scripts/./check-protected.ts')).toBeNull()
  })

  it('parses and deduplicates an explicit scope', () => {
    expect(parseAuthorizationScope('package.json,\nscripts/check-protected.ts\npackage.json')).toEqual([
      'package.json',
      'scripts/check-protected.ts',
    ])
  })

  it('rejects malformed scope entries', () => {
    expect(() => parseAuthorizationScope('package.json,../secret')).toThrow('invalid path')
  })

  it('requires every changed protected path to be authorized', () => {
    expect(validateAuthorizationScope(['package.json'], ['package.json'], registry)).toEqual({
      authorized: ['package.json'],
      outOfScope: [],
      invalid: [],
    })
    expect(validateAuthorizationScope(['package.json', 'scripts/check-protected.ts'], ['package.json'], registry).outOfScope)
      .toEqual(['scripts/check-protected.ts'])
  })

  it('rejects authorization for paths outside the protected registry', () => {
    expect(validateAuthorizationScope(['package.json'], ['package.json', 'README.md'], registry).invalid).toEqual(['README.md'])
  })

  it('reads only the marked protected-path list', () => {
    const document = '<!-- HARNESS:PROTECTED-PATHS:START -->\n검사 대상 보호 경로:\n- package.json\n<!-- HARNESS:PROTECTED-PATHS:END -->'
    expect(parseProtectedPaths(document)).toEqual(['package.json'])
  })
})
