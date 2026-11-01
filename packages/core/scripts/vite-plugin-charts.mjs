import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const deckRoot = () => process.cwd()
const dataDir = () => join(deckRoot(), 'data')
const publicDataDir = () => join(deckRoot(), 'public', 'data')

function copyCsvFiles() {
  const source = dataDir()
  if (!existsSync(source)) return
  const files = readdirSync(source).filter(file => file.endsWith('.csv')).sort()
  mkdirSync(publicDataDir(), { recursive: true })
  for (const file of files) {
    const from = join(source, file)
    const to = join(publicDataDir(), file)
    if (!existsSync(to) || readFileSync(from, 'utf8') !== readFileSync(to, 'utf8')) writeFileSync(to, readFileSync(from))
  }
  writeFileSync(join(publicDataDir(), 'manifest.json'), JSON.stringify({ files }))
}

/** CSVをChartコンポーネントから読めるようpublic/dataへ同期する。 */
export function templateCharts() {
  return {
    name: 'slidev-kit-charts',
    buildStart() {
      if (!process.env.VITEST) copyCsvFiles()
    },
    configureServer(server) {
      copyCsvFiles()
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/charts/') || req.url?.startsWith('/data/')) res.setHeader('Cache-Control', 'no-store')
        next()
      })
      if (!existsSync(dataDir())) return
      server.watcher.add(dataDir())
      const handle = path => {
        if (path.endsWith('.csv')) {
          copyCsvFiles()
          server.ws.send({ type: 'full-reload' })
        }
      }
      server.watcher.on('change', handle)
      server.watcher.on('add', handle)
      server.watcher.on('unlink', handle)
    },
  }
}
