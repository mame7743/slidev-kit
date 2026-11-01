import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolvePython } from './python.mjs'

// デッキ側の場所（Slidevはデッキのルートで実行される）
const deckRoot = () => process.cwd()
const deckDataDir = () => join(deckRoot(), 'data')
const deckPublicDataDir = () => join(deckRoot(), 'public', 'data')
const deckRecipePath = () => join(deckRoot(), 'scripts', 'charts', 'run.py')

let running = false
let pending = false

function warn(buffer, message) {
  buffer.push(`[slidev-kit] ${message}`)
}

/** data/*.csv を public/data/ へコピーし、利用可能一覧 manifest.json を生成する。 */
function copyCsvFiles() {
  const source = deckDataDir()
  if (!existsSync(source)) return []
  const files = readdirSync(source).filter((file) => file.endsWith('.csv')).sort()
  mkdirSync(deckPublicDataDir(), { recursive: true })
  for (const file of files) {
    const from = join(source, file)
    const to = join(deckPublicDataDir(), file)
    if (!existsSync(to) || readFileSync(from, 'utf8') !== readFileSync(to, 'utf8')) {
      writeFileSync(to, readFileSync(from))
    }
  }
  writeFileSync(join(deckPublicDataDir(), 'manifest.json'), JSON.stringify({ files }))
  return []
}

function runChartsSync() {
  // 作り込んだ図のレシピはデザインテンプレート側（プロジェクトの scripts/charts/run.py）。
  if (!existsSync(deckRecipePath())) return []
  const python = resolvePython(deckRoot())
  if (!python) {
    return ['matplotlib環境が見つかりません。作成済みの public/charts/ をそのまま使用します。']
  }
  const result = spawnSync(python, [deckRecipePath()], { encoding: 'utf8', cwd: deckRoot() })
  if (result.status !== 0) {
    return [`scripts/charts/run.py が失敗しました（exit ${result.status}）。\n${(result.stderr || result.stdout || '').trim()}`]
  }
  return []
}

function scheduleChartsReload(server) {
  if (running) {
    pending = true
    return
  }
  running = true
  const messages = []
  Promise.resolve().then(() => {
    const python = resolvePython(deckRoot())
    if (!python) {
      warn(messages, 'matplotlib環境が見つかりません。SVGを更新できませんでした。')
      return
    }
    return new Promise((done) => {
      const child = spawn(python, [deckRecipePath()], { encoding: 'utf8', cwd: deckRoot() })
      child.on('close', (code) => {
        if (code !== 0) {
          warn(messages, `scripts/charts/run.py が失敗しました（exit ${code}）。前のSVGを使い続けます。`)
        }
        done()
      })
    })
  }).then(() => {
    running = false
    if (pending && !running) {
      pending = false
      scheduleChartsReload(server)
      return
    }
    if (messages.length > 0) {
      console.error(messages.join('\n'))
    }
    server.hot.send({ type: 'full-reload' })
  })
}

/**
 * Slidevのdev/build/exportで、
 * 1. data/*.csv を public/data/ へコピー（Chartのfetch用）
 * 2. プロジェクトの scripts/charts/run.py があればSVGを先に生成
 * を実行するViteプラグイン。デッキの場所は process.cwd() から解決する。
 */
export function templateCharts() {
  return {
    name: 'slidev-kit-charts',
    buildStart() {
      if (process.env.VITEST) return
      copyCsvFiles()
      const messages = runChartsSync()
      if (messages.length > 0) {
        this.warn(messages.join('\n'))
      }
    },
    configureServer(server) {
      copyCsvFiles()
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/charts/') || req.url?.startsWith('/data/')) {
          res.setHeader('Cache-Control', 'no-store')
        }
        next()
      })
      const dataDir = deckDataDir()
      const recipeDir = join(deckRoot(), 'scripts', 'charts')
      if (existsSync(dataDir)) {
        server.watcher.add([dataDir, recipeDir, join(deckRoot(), 'designs', 'palettes.json')])
        const handle = (path) => {
          if (path.endsWith('.csv') || path.endsWith('.py') || path.endsWith('palettes.json')) {
            copyCsvFiles()
            if (existsSync(deckRecipePath())) scheduleChartsReload(server)
          }
        }
        server.watcher.on('change', handle)
        server.watcher.on('add', handle)
      }
    },
  }
}
