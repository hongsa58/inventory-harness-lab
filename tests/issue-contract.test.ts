import { describe, expect, it } from 'vitest'
import { formatIssueContractResult, validateIssueContract } from '@/../scripts/issue-contract'

const valid = {
  issueNumber: 5,
  issueState: 'OPEN',
  branch: 'fix/issue-5-popup-expiry',
  commitMessages: ['fix: resolve popup expiry (#5)'],
  pullRequestBody: 'Fixes #5',
  testFiles: ['tests/issues/issue-5-popup-expiry.test.ts'],
  maxAttempts: '3',
}

describe('Issue contract', () => {
  it('accepts complete Issue, branch, commit, PR, and test linkage', () => {
    const result = validateIssueContract(valid)

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('reports missing linkage and invalid attempt limits', () => {
    const result = validateIssueContract({
      ...valid,
      issueState: 'CLOSED',
      branch: 'feature/unrelated',
      commitMessages: ['chore: cleanup'],
      pullRequestBody: 'Updates the code',
      testFiles: ['tests/other.test.ts'],
      maxAttempts: '4',
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(6)
    expect(formatIssueContractResult(result)).toContain('NEEDS_HUMAN')
  })

  it('accepts references in commit and PR text case-insensitively', () => {
    const result = validateIssueContract({
      ...valid,
      commitMessages: ['Fixes #5'],
      pullRequestBody: 'closes #5',
    })

    expect(result.valid).toBe(true)
    expect(result.linkedReferences).toEqual(['5'])
  })
})
