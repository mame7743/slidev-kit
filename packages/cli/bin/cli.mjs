#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
let workflow
try {
  workflow = require('slidev-runner/deck-workflow')
} catch {
  workflow = await import('../../runner/src/deck-workflow.mjs')
}
const { defaultDeck, readConfig } = workflow
const cliDir = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(require('fs').readFileSync(join(cliDir, '..', 'package.json'), 'utf8'))

const usage = `slidev-kit — Slidevデッキの作成・プレビュー・検査・ビルド・PDF・エージェント

使い方（プロジェクトのルートで実行）:
  slidev-kit [deck.md] [--open] [--port 3030]  プレビュー（既定動作）
  slidev-kit build [deck.md] [--check-only] [slidevのフラグ]
  slidev-kit pdf [deck.md] [--output file.pdf]
  slidev-kit doctor [--pdf]
  slidev-kit agent run "進捗報告のスライドを作って" [options]
  slidev-kit agent chat [options]
  slidev-kit agent tools
  slidev-kit agent doctor
  slidev-kit mcp                 MCP stdioサーバーを起動
  slidev-kit init [name] [--title "..."] [--template=<name|path>] [--kit=<spec>] [--slidev=<version>]

  slidev-kit init は name が .md で終わるか省略された場合、現在のプロジェクトへ雛形を作成します。
  それ以外は name/ に独立したプロジェクトを生成します。

省略時のデッキは slidev-kit.config.json の defaultDeck（既定 slides.md）。
バージョン: ${pkg.version}
`

function packageCli(name) {
  // 同梱tarball（node_modules解決）と開発リポジトリの両方で動くようにする。
  try {
    const pkgPath = require.resolve(`${name}/package.json`)
    return join(dirname(pkgPath), 'src', 'cli.mjs')
  } catch {
    const workspaceName = { 'slidev-runner': 'runner', 'slidev-agent': 'agent', 'slidev-mcp': 'mcp' }[name] ?? name
    return join(cliDir, '..', '..', workspaceName, 'src', 'cli.mjs')
  }
}

function deckRequire() {
  return createRequire(join(process.cwd(), 'package.json'))
}

function kitScript(file) {
  // 検査はエンジン自身が持つ（テーマ不要）。
  try {
    return require.resolve(`slidev-kit/${file}`)
  } catch {
    return join(cliDir, '..', '..', 'core', file === 'check' ? 'check.mjs' : file)
  }
}

function run(script, argv) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [script, ...argv], { cwd: process.cwd(), stdio: 'inherit' })
    child.once('error', reject)
    child.once('close', (code) => resolvePromise(code ?? 1))
  })
}

async function main() {
  const args = process.argv.slice(2)
  if (!args.length) return run(packageCli('slidev-runner'), ['dev'])
  const [command, ...rest] = args
  if (command === '--help' || command === '-h' || command === 'help') {
    console.log(usage)
    return 0
  }
  if (command === '--version' || command === '-v') {
    console.log(pkg.version)
    return 0
  }
  if (command === 'init') {
    let script
    try { script = require.resolve('slidev-core/init') } catch { script = join(cliDir, '..', '..', 'core', 'init.mjs') }
    return run(script, rest)
  }
  if (command === 'agent') return run(packageCli('slidev-agent'), rest)
  if (command === 'mcp') return run(packageCli('slidev-mcp'), rest)
  if (command === 'dev') return run(packageCli('slidev-runner'), ['dev', ...rest])
  if (command === 'doctor') return run(packageCli('slidev-runner'), ['doctor', ...rest])
  if (command === 'pdf') return run(packageCli('slidev-runner'), ['export', ...rest])
  if (command === 'build') {
    // slidev-kit build は検査を必ず通す。--check-only なら検査だけ行う。
    const fileArg = rest[0] && !rest[0].startsWith('-') ? rest[0] : undefined
    const flags = fileArg ? rest.slice(1) : rest
    const samples = readConfig(process.cwd()).samples
    const checkArgs = []
    if (fileArg) checkArgs.push(fileArg)
    else if (!flags.some((flag) => flag.startsWith('--samples'))) checkArgs.push(defaultDeck(process.cwd()))
    if (samples) checkArgs.push(`--samples=${Array.isArray(samples) ? samples.join(',') : samples}`)
    if (flags.includes('--check-only')) {
      return run(kitScript('check'), [...checkArgs, ...flags.filter((flag) => flag !== '--check-only')])
    }
    const checkCode = await run(kitScript('check'), checkArgs)
    if (checkCode !== 0) return checkCode
    return run(packageCli('slidev-runner'), ['build', fileArg ?? defaultDeck(process.cwd()), ...flags])
  }
  // 既定動作: ファイル指定のプレビュー
  return run(packageCli('slidev-runner'), ['dev', command, ...rest])
}

main().then(
  (code) => {
    process.exitCode = code
  },
  (error) => {
    console.error(`[slidev-kit] ${error.message}`)
    process.exitCode = 1
  },
)
