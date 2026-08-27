export type VerificationStep = {
  name: string
  status: 'passed' | 'failed' | 'blocked' | 'not-run'
  command?: string
  output?: string
}

export type VerificationEvidence = {
  schemaVersion: 1
  issueNumber?: number
  pullRequestNumber?: number
  commitSha: string
  attempt: number
  timestamp: string
  steps: VerificationStep[]
  needsHuman: boolean
  reason?: string
}

export function serializeVerificationEvidence(evidence: VerificationEvidence): string {
  return `${JSON.stringify(evidence, null, 2)}\n`
}

export function formatVerificationEvidence(evidence: VerificationEvidence): string {
  const lines = [
    `## Verification evidence (attempt ${evidence.attempt})`,
    `- Commit: \`${evidence.commitSha}\``,
    ...(evidence.issueNumber ? [`- Issue: #${evidence.issueNumber}`] : []),
    ...(evidence.pullRequestNumber ? [`- PR: #${evidence.pullRequestNumber}`] : []),
    '',
    '| Step | Status | Command |',
    '| --- | --- | --- |',
    ...evidence.steps.map((step) => `| ${step.name} | ${step.status} | ${step.command ?? ''} |`),
  ]
  if (evidence.needsHuman) lines.push('', `> NEEDS_HUMAN: ${evidence.reason ?? 'Human action is required.'}`)
  return `${lines.join('\n')}\n`
}
