export type IssueContractInput = {
  issueNumber: number
  issueState: string
  branch: string
  commitMessages: string[]
  pullRequestBody: string
  testFiles: string[]
  maxAttempts: number | string
}

export type IssueContractResult = {
  valid: boolean
  errors: string[]
  linkedReferences: string[]
  issueTestFiles: string[]
}

const ISSUE_REFERENCE = /\b(?:fix(?:e[sd])?|close[sd]?|resolve[sd]?|ref(?:s)?)\s+#(\d+)\b/gi
const ISSUE_TEST = /^tests\/issues\/issue-(\d+)-[^/]+\.test\.ts$/

export function validateIssueContract(input: IssueContractInput): IssueContractResult {
  const errors: string[] = []
  const issue = String(input.issueNumber)
  const references = [...input.pullRequestBody.matchAll(ISSUE_REFERENCE)].map((match) => match[1])
  const issueTestFiles = input.testFiles.filter((file) => ISSUE_TEST.test(file.replaceAll('\\', '/')))

  if (!Number.isInteger(input.issueNumber) || input.issueNumber <= 0) {
    errors.push('Issue number must be a positive integer.')
  }
  if (input.issueState.toUpperCase() !== 'OPEN') {
    errors.push(`Issue #${issue} must be OPEN.`)
  }
  if (!new RegExp(`(?:^|[-_/])${issue}(?:[-_/]|$)`).test(input.branch)) {
    errors.push(`Branch must contain Issue #${issue}.`)
  }
  if (!references.includes(issue)) {
    errors.push(`Pull request body must reference Issue #${issue} with Fixes, Closes, Resolves, or Refs.`)
  }
  if (!input.commitMessages.some((message) => new RegExp(`#${issue}(?!\\d)`).test(message))) {
    errors.push(`At least one commit message must reference Issue #${issue}.`)
  }
  if (!issueTestFiles.some((file) => ISSUE_TEST.exec(file.replaceAll('\\', '/'))?.[1] === issue)) {
    errors.push(`A test file matching tests/issues/issue-${issue}-*.test.ts is required.`)
  }

  const maxAttempts = Number(input.maxAttempts)
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 3) {
    errors.push('Maximum attempts must be an integer from 1 through 3.')
  }

  return { valid: errors.length === 0, errors, linkedReferences: references, issueTestFiles }
}

export function formatIssueContractResult(result: IssueContractResult): string {
  if (result.valid) return 'Issue contract passed.'
  return ['NEEDS_HUMAN: Issue contract failed.', ...result.errors.map((error) => `- ${error}`)].join('\n')
}

function main() {
  const raw = process.argv[2]
  if (!raw) throw new Error('Usage: tsx scripts/issue-contract.ts <contract.json>')
  const input = JSON.parse(raw) as IssueContractInput
  const result = validateIssueContract(input)
  console.log(formatIssueContractResult(result))
  if (!result.valid) process.exitCode = 1
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/issue-contract.ts')) main()
