/**
 * docs/06-architecture.md에 정의된 production source 경계를 정적으로 검사한다.
 * DB를 열지 않으며, 검증용 DB 준비와 독립적으로 실행할 수 있다.
 */
import ts from 'typescript'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const srcRoot = path.join(root, 'src')
const stockFile = path.normalize(path.join(srcRoot, 'lib', 'stock.ts'))
const mutationMethods = new Set([
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
])

type Finding = {
  file: string
  line: number
  rule: string
  message: string
}

function sourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return entry.name === 'generated' ? [] : sourceFiles(file)
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [file] : []
  })
}

function relativeFile(file: string): string {
  return path.relative(root, file).replaceAll(path.sep, '/')
}

function isPropertyAccess(node: ts.Node): node is ts.PropertyAccessExpression {
  return ts.isPropertyAccessExpression(node)
}

function modelMutation(node: ts.CallExpression): { model: string; method: string } | null {
  if (!isPropertyAccess(node.expression)) return null
  const method = node.expression.name.text
  const modelAccess = node.expression.expression
  if (!isPropertyAccess(modelAccess) || !mutationMethods.has(method)) return null
  return { model: modelAccess.name.text, method }
}

function moduleIsForbiddenInComponents(specifier: string): boolean {
  return (
    specifier === '@/lib/db' ||
    specifier.startsWith('@/generated/prisma') ||
    specifier.includes('/generated/prisma')
  )
}

function moduleIsForbiddenInProxy(specifier: string): boolean {
  return (
    specifier === '@/lib/auth' ||
    specifier === '@/lib/db' ||
    specifier.startsWith('@/generated/prisma') ||
    specifier.includes('/generated/prisma') ||
    specifier.startsWith('@/actions/')
  )
}

function hasUseServerDirective(source: ts.SourceFile): boolean {
  const first = source.statements[0]
  return (
    first !== undefined &&
    ts.isExpressionStatement(first) &&
    ts.isStringLiteral(first.expression) &&
    first.expression.text === 'use server'
  )
}

function analyzeFile(file: string): Finding[] {
  const text = readFileSync(file, 'utf8')
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )
  const findings: Finding[] = []
  const relative = relativeFile(file)
  const inStock = path.normalize(file) === stockFile
  const inComponents = relative.startsWith('src/components/')
  const inActions = relative.startsWith('src/actions/')
  const inProxy = relative === 'src/proxy.ts'
  let callsApplyMovement = false
  let hasTransaction = false

  const report = (node: ts.Node, rule: string, message: string) => {
    const position = source.getLineAndCharacterOfPosition(node.getStart(source))
    findings.push({ file: relative, line: position.line + 1, rule, message })
  }

  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text
      if (inComponents && moduleIsForbiddenInComponents(specifier)) {
        report(node.moduleSpecifier, 'ARCH-UI-PRISMA-001', `UI layer cannot import Prisma boundary: ${specifier}`)
      }
      if (inProxy && moduleIsForbiddenInProxy(specifier)) {
        report(node.moduleSpecifier, 'ARCH-PROXY-001', `proxy cannot import server/database module: ${specifier}`)
      }
    }

    if (ts.isCallExpression(node)) {
      const mutation = modelMutation(node)
      if (mutation?.model === 'lot' && !inStock) {
        report(
          node.expression,
          'ARCH-LOT-001',
          `Lot.${mutation.method} must go through src/lib/stock.ts applyMovement()`,
        )
      }
      if (mutation?.model === 'movement' && (mutation.method === 'delete' || mutation.method === 'deleteMany')) {
        report(
          node.expression,
          'ARCH-MOVEMENT-001',
          'Movement deletion is forbidden; use reverseMovement() to append a compensating movement',
        )
      }
      if (inComponents && mutation) {
        report(node.expression, 'ARCH-UI-PRISMA-002', 'components cannot perform Prisma mutations')
      }
      if (isPropertyAccess(node.expression) && node.expression.name.text === '$transaction') {
        hasTransaction = true
      }
      if (ts.isIdentifier(node.expression) && node.expression.text === 'applyMovement') {
        callsApplyMovement = true
      }
    }

    ts.forEachChild(node, visit)
  }
  visit(source)

  if (inActions && !hasUseServerDirective(source)) {
    report(source, 'ARCH-ACTION-001', "Server Action must start with 'use server'")
  }
  if (inActions && callsApplyMovement && !hasTransaction) {
    report(source, 'ARCH-TX-001', 'An action calling applyMovement() must use db.$transaction()')
  }

  return findings
}

const findings = sourceFiles(srcRoot).flatMap(analyzeFile).sort((a, b) =>
  `${a.file}:${a.line}:${a.rule}`.localeCompare(`${b.file}:${b.line}:${b.rule}`),
)

if (findings.length > 0) {
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line}: ${finding.rule} — ${finding.message}`)
  }
  process.exitCode = 1
} else {
  console.log('Architecture checks passed.')
}
