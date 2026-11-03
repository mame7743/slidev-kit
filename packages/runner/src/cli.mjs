#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromiumPath, deckPath, defaultDeck, slidevCli, slidevArgs, themeCheckPath } from './deck-workflow.mjs'

const root = process.cwd()
const [command, ...args] = process.argv.slice(2)
const usage = `使い方（通常は slidev-kit から呼び出されます。プロジェクトのルートで実行）:
  slidev-kit [report.md] [--open] [--port 3030]  プレビュー（既定動作）
  slidev-kit build [report.md] [--check-only]
  slidev-kit pdf [report.md] [--output file.pdf]
  slidev-kit doctor [--pdf]

内部実装コマンド（slidev-kit が内部で呼び出します）:
  slidev-runner dev [report.md] [--open] [--port 3030]
  slidev-runner build [report.md]
  slidev-runner export [report.md]
  slidev-runner check report.md
  slidev-runner doctor [--pdf]

省略時のデッキは slidev-kit.config.json の defaultDeck（既定 slides.md）。`

async function run(script, argv) {
  return new Promise((done, fail) => {
    const child = spawn(process.execPath, [script, ...argv], { cwd: root, stdio: 'inherit' })
    const interrupt = () => child.kill('SIGINT')
    const terminate = () => child.kill('SIGTERM')
    process.once('SIGINT', interrupt)
    process.once('SIGTERM', terminate)
    const cleanup = () => {
      process.off('SIGINT', interrupt)
      process.off('SIGTERM', terminate)
    }
    child.once('error', error => { cleanup(); fail(error) })
    child.once('close', (code, signal) => { cleanup(); done(code ?? (signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : 1)) })
  })
}

try {
  if (command === '--help' || command === '-h' || args.includes('--help') || !command) console.log(usage)
  else if (command === 'doctor') {
    if (args.some(arg => arg !== '--pdf')) throw new Error(usage)
    const [major, minor] = process.versions.node.split('.').map(Number)
    if (major < 22 || (major === 22 && minor < 12)) throw new Error('Node >=22.12 が必要です（推奨24）。')
    slidevCli(root)
    console.log(`OK Node ${process.versions.node}\nOK Slidev インストール済み`)
    const browser = chromiumPath(root)
    console.log(browser ? `OK PDF用ブラウザー: ${browser}` : '任意: PDF用ブラウザー（Chromium/Edge）がありません。npx playwright install chromium を実行してください。')
    if (args.includes('--pdf') && !browser) throw new Error('PDF出力にはChromiumが必要です。')
  } else if (['dev', 'build', 'export', 'check'].includes(command)) {
    const file = args[0] && !args[0].startsWith('-') ? args.shift() : defaultDeck(root)
    const target = deckPath(root, file, true)
    if (!existsSync(target)) throw new Error(`デッキが見つかりません: ${file}`)
    if (command === 'check') {
      const script = themeCheckPath(root)
      if (!script) throw new Error('slidev-template が見つかりません。check にはテーマが必要です。')
      process.exitCode = await run(script, [file, ...args])
    } else {
      let browser
      if (command === 'export') {
        if (!args.some(arg => arg === '--executable-path' || arg.startsWith('--executable-path='))) {
          browser = chromiumPath(root)
          if (!browser) throw new Error('PDF用ブラウザー（Chromium/Edge）がありません。npx playwright install chromium または CHROMIUM_PATH を設定してください。')
        }
        const outDir = file.replace(/\\/g, '/').replace(/^\.\//, '').startsWith('examples/') ? resolve(root, 'examples') : resolve(root, 'exports')
        mkdirSync(outDir, { recursive: true })
      }
      process.exitCode = await run(slidevCli(root), slidevArgs(command, file, args, browser))
    }
  } else throw new Error(usage)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
