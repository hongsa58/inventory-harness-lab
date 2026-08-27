import { describe, expect, it } from 'vitest'
import { formatVerificationEvidence, serializeVerificationEvidence, type VerificationEvidence } from '@/../scripts/verification-evidence'

const evidence: VerificationEvidence = {
  schemaVersion: 1,
  issueNumber: 5,
  pullRequestNumber: 6,
  commitSha: 'abc123',
  attempt: 1,
  timestamp: '2026-08-27T00:00:00.000Z',
  steps: [
    { name: 'Protected', status: 'blocked', command: 'npm run check:protected', output: 'NEEDS_HUMAN' },
    { name: 'Test', status: 'not-run', command: 'npm test' },
  ],
  needsHuman: true,
  reason: 'Protected-path approval is missing.',
}

describe('verification evidence', () => {
  it('serializes stable machine-readable evidence', () => {
    const parsed = JSON.parse(serializeVerificationEvidence(evidence))

    expect(parsed).toEqual(evidence)
    expect(serializeVerificationEvidence(evidence)).toContain('"schemaVersion": 1')
  })

  it('formats step results and human handoff for PR summaries', () => {
    const report = formatVerificationEvidence(evidence)

    expect(report).toContain('## Verification evidence (attempt 1)')
    expect(report).toContain('| Protected | blocked | npm run check:protected |')
    expect(report).toContain('NEEDS_HUMAN: Protected-path approval is missing.')
  })
})
