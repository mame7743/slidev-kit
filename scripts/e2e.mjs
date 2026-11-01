import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// GitHub npm-exec installs the repository root package; test its packed checkout form.
const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const work = mkdtempSync(join(tmpdir(), 'slidev-kit-github-e2e-'))
const packed = spawnSync('npm', ['pack', '--pack-destination', work, '--ignore-scripts'], { cwd: root, encoding: 'utf8' })
if (packed.status !== 0) throw new Error(`リポジトリ pack 失敗:\n${packed.stderr}`)
const tarball = join(work, packed.stdout.trim().split(/\r?\n/).at(-1))
const designPacked = spawnSync('npm', ['pack', '--pack-destination', work, '--ignore-scripts'], { cwd: join(root, 'examples', 'design-library'), encoding: 'utf8' })
if (designPacked.status !== 0) throw new Error(`共有デザイン pack 失敗:\n${designPacked.stderr}`)
const designTarball = join(work, designPacked.stdout.trim().split(/\r?\n/).at(-1))

function run(command, args, cwd, input) {
  return spawnSync(command, args, { cwd, input, encoding: 'utf8', timeout: 120_000 })
}

try {
  writeFileSync(join(work, 'package.json'), JSON.stringify({
    name: 'slidev-kit-e2e', private: true, type: 'module',
    dependencies: { 'slidev-kit': `file:${tarball}` },
  }))
  const installCli = run('npm', ['install', '--no-audit', '--no-fund'], work)
  if (installCli.status !== 0) throw new Error(`GitHub CLI install 失敗:\n${installCli.stderr}`)
  const init = run('npx', ['slidev-kit', 'init', 'demo', '--kit', `file:${tarball}`], work)
  if (init.status !== 0) throw new Error(`init 失敗:\n${init.stderr}`)
  const templatePath = join(root, 'examples', 'template-library', 'templates', 'corporate')
  const templateInit = run('npx', ['slidev-kit', 'init', 'template-smoke', `--template=${templatePath}`], work)
  if (templateInit.status !== 0) throw new Error(`GitHub template layout init 失敗:\n${templateInit.stderr}`)
  const templatePackage = JSON.parse(readFileSync(join(work, 'template-smoke', 'package.json'), 'utf8'))
  if (templatePackage.slidev.themeConfig.variant !== 'acme' || !readFileSync(join(work, 'template-smoke', 'designs', 'acme', 'index.ts'), 'utf8').includes('@example/slidev-designs/acme')) throw new Error('共有デザイン用テンプレートの生成に失敗しました')
  writeFileSync(join(work, 'demo', 'data', 'trend.csv'), 'month,value\n1月,10\n2月,20\n')
  writeFileSync(join(work, 'demo', 'data', 'target.csv'), 'period,actual,target\nQ1,10,12\nQ2,15,14\n')
  const slides = readFileSync(join(work, 'demo', 'slides.md'), 'utf8')
  writeFileSync(join(work, 'demo', 'slides.md'), `${slides}\n---\nlayout: content\ntitle: Chart\n---\n\n<Chart src="data/trend.csv" type="line" />\n\n---\nlayout: content\ntitle: Preset chart\n---\n\n<Chart preset="target-trend" src="data/target.csv" />\n`)
  const projectPackage = JSON.parse(readFileSync(join(work, 'demo', 'package.json'), 'utf8'))
  projectPackage.devDependencies['@example/slidev-designs'] = `file:${designTarball}`
  projectPackage.slidev.themeConfig = { variant: 'acme', organization: 'Example Inc.', department: '企画部', classification: '社外秘', documentId: 'E2E-001', revision: 'Rev.1' }
  writeFileSync(join(work, 'demo', 'package.json'), JSON.stringify(projectPackage, null, 2))
  mkdirSync(join(work, 'demo', 'designs', 'acme'), { recursive: true })
  writeFileSync(join(work, 'demo', 'designs', 'acme', 'index.ts'), "export { default } from '@example/slidev-designs/acme'\n")
  const installDeck = run('npm', ['install', '--no-audit', '--no-fund'], join(work, 'demo'))
  if (installDeck.status !== 0) throw new Error(`デッキ依存 install 失敗:\n${installDeck.stderr}`)
  const build = run('npx', ['slidev-kit', 'build', 'slides.md'], join(work, 'demo'))
  if (build.status !== 0) throw new Error(`build 失敗:\n${build.stdout}\n${build.stderr}`)
  const chartFiles = readdirSync(join(work, 'demo', 'public', 'charts'))
  if (!chartFiles.some(file => readFileSync(join(work, 'demo', 'public', 'charts', file), 'utf8').includes('<svg'))) throw new Error('プリセット図表のSVGが生成されませんでした')
  const protocol = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'e2e', version: '1' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
  ].map(message => JSON.stringify(message)).join('\n') + '\n'
  const mcp = run('npx', ['slidev-kit', 'mcp'], join(work, 'demo'), protocol)
  if (mcp.status !== 0 || !mcp.stdout.includes('"name":"deck_info"')) throw new Error(`MCP 起動失敗:\n${mcp.stdout}\n${mcp.stderr}`)
  console.log('e2e OK: GitHub package → init → custom design build → MCP')
} finally {
  rmSync(work, { recursive: true, force: true })
}
