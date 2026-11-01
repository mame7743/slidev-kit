import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { canonical, figureHashFromConfig, hashString, normalizeFigureProps } from '../shared/figure.mjs'
import { parseAndValidate, CsvError } from '../csv/parse.mjs'
import { scanMarkdown } from './scan.mjs'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const pythonScript = join(packageRoot, 'python', 'render.py')
const presetsPath = join(packageRoot, 'src', 'presets', 'presets.json')
const schemasPath = join(packageRoot, 'src', 'schemas', 'schemas.json')
const themesDir = join(packageRoot, 'src', 'themes')

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', 'dist', '.slidev', '.git', 'public', '.venv', 'venv', '__pycache__', '.cache'].includes(name)) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, files)
    else if (name.endsWith('.md')) files.push(path)
  }
  return files
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function resolvePython(root) {
  const candidates = [
    process.env.CHARTS_PYTHON,
    join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'),
    'python3',
    'python',
  ].filter(Boolean)
  for (const candidate of candidates) {
    const executable = candidate.includes('/') || candidate.includes('\\') ? resolve(root, candidate) : candidate
    const result = spawnSync(executable, ['-c', 'import matplotlib'], { encoding: 'utf8' })
    if (result.status === 0) return executable
  }
  return undefined
}

function collectJobs(root) {
  const presets = readJson(presetsPath)
  const schemas = readJson(schemasPath)
  const jobs = new Map()
  const warnings = []
  for (const file of walk(root)) {
    const text = readFileSync(file, 'utf8')
    for (const tag of scanMarkdown(text)) {
      if (tag.props.type !== undefined) continue
      const { config, unknown } = normalizeFigureProps(tag.props)
      for (const key of unknown) warnings.push(`${relative(root, file)}:${tag.line}: 未知のPropを無視しました: ${key}`)
      const preset = presets[config.preset]
      if (!preset) throw new Error(`${relative(root, file)}:${tag.line}: 不明なpresetです: ${config.preset}`)
      const schemaName = preset.schema
      const schema = schemas[schemaName]
      if (!schema) throw new Error(`${relative(root, file)}:${tag.line}: スキーマがありません: ${schemaName}`)
      const csvPath = resolve(root, String(config.src))
      const csvRelative = relative(resolve(root), csvPath)
      if (csvRelative.startsWith('..') || isAbsolute(csvRelative)) throw new Error(`${relative(root, file)}:${tag.line}: src はプロジェクト内を指定してください: ${config.src}`)
      if (!existsSync(csvPath)) throw new Error(`${relative(root, file)}:${tag.line}: CSVがありません: ${config.src}`)
      const csv = readFileSync(csvPath, 'utf8')
      try {
        parseAndValidate(csv, schema, { schemaName })
      } catch (error) {
        if (error instanceof CsvError) {
          throw new Error(`${relative(root, file)}:${tag.line}: ${config.src}: ${error.message}`)
        }
        throw error
      }
      const themePath = join(themesDir, `${config.theme}.json`)
      const theme = existsSync(themePath) ? readFileSync(themePath, 'utf8') : ''
      const custom = config.custom ? resolve(root, String(config.custom)) : ''
      const customRelative = custom ? relative(resolve(root), custom) : ''
      if (customRelative.startsWith('..') || (custom && isAbsolute(customRelative))) throw new Error(`${relative(root, file)}:${tag.line}: custom はプロジェクト内を指定してください: ${config.custom}`)
      const customSource = custom && existsSync(custom) ? readFileSync(custom, 'utf8') : ''
      const id = figureHashFromConfig(config)
      const inputHash = hashString(canonical(config) + csv + JSON.stringify(preset) + theme + customSource)
      const output = join(root, 'public', 'charts', `${id}.svg`)
      jobs.set(id, { id, config, csvPath, output, inputHash, theme: config.theme, source: relative(root, file), line: tag.line })
    }
  }
  return { jobs: [...jobs.values()], warnings }
}

function renderJobs(root, jobs, context) {
  if (jobs.length === 0) return
  const python = resolvePython(root)
  if (!python) {
    context.warn('slidev-charts: matplotlib が使える Python が見つかりません。既存のSVGを使用します。')
    return
  }
  mkdirSync(join(root, 'public', 'charts'), { recursive: true })
  const payload = JSON.stringify({
    presets: presetsPath,
    schemas: schemasPath,
    themes: themesDir,
    jobs: jobs.map(job => ({ id: job.id, preset: job.config.preset, config: job.config, csvPath: job.csvPath, output: job.output })),
  })
  const result = spawnSync(python, [pythonScript], { cwd: root, input: payload, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
  if (result.status !== 0) throw new Error(`slidev-charts: Pythonレンダリングに失敗しました。\n${(result.stderr || result.stdout || '').trim()}`)
}

function generateAll(root, warn) {
  const { jobs, warnings } = collectJobs(root)
  for (const warning of warnings) warn(warning)
  const cachePath = join(root, '.slidev', 'fig-cache.json')
  const cache = existsSync(cachePath) ? readJson(cachePath) : {}
  const pending = jobs.filter(job => cache[job.id] !== job.inputHash || !existsSync(job.output))
  if (pending.length > 0 && !resolvePython(root)) {
    warn('slidev-charts: matplotlib が使える Python が見つかりません。既存のSVGを使用します。')
    return { jobs, pending }
  }
  renderJobs(root, pending, { warn })
  mkdirSync(dirname(cachePath), { recursive: true })
  writeFileSync(cachePath, JSON.stringify(Object.fromEntries(jobs.map(job => [job.id, job.inputHash])), null, 2))
  return { jobs, pending }
}

export function slidevCharts() {
  const buildId = Date.now().toString(36)
  return {
    name: 'slidev-charts',
    config() {
      try {
        generateAll(process.cwd(), message => console.warn(message))
      } catch (error) {
        console.error(error.message)
        throw error
      }
      return { define: { __FIG_BUILD_ID__: JSON.stringify(buildId) } }
    },
    async buildStart() {
      generateAll(process.cwd(), message => this.warn(message))
    },
    configureServer(server) {
      const root = process.cwd()
      const generate = () => {
        try {
          generateAll(root, message => server.config.logger.warn(message))
        } catch (error) {
          server.config.logger.error(error.message)
        }
      }
      generate()
      let timer
      const onChange = (path) => {
        if (!/\.(md|csv|py|json)$/.test(path)) return
        clearTimeout(timer)
        timer = setTimeout(() => {
          generate()
          server.ws.send({ type: 'full-reload' })
        }, 150)
      }
      server.watcher.on('change', onChange)
      server.watcher.on('add', onChange)
      server.watcher.on('unlink', onChange)
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/charts/fig-')) res.setHeader('Cache-Control', 'no-store')
        next()
      })
    },
  }
}

export { collectJobs, renderJobs }
