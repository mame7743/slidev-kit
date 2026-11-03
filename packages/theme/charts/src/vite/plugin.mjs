import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { canonical, figureHashFromConfig, hashString, normalizeFigureProps } from '../shared/figure.mjs'
import { parseAndValidate, CsvError } from '../csv/parse.mjs'
import { scanMarkdown } from './scan.mjs'
import { renderFigure } from './render.mjs'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
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

const readJson = path => JSON.parse(readFileSync(path, 'utf8'))

function collectJobs(root) {
  const presets = readJson(presetsPath)
  const schemas = readJson(schemasPath)
  const jobs = new Map()
  const warnings = []
  for (const file of walk(root)) {
    for (const tag of scanMarkdown(readFileSync(file, 'utf8'))) {
      if (tag.props.type !== undefined) continue
      const { config, unknown } = normalizeFigureProps(tag.props)
      for (const key of unknown) warnings.push(`${relative(root, file)}:${tag.line}: 未知のPropを無視しました: ${key}`)
      const preset = presets[config.preset]
      if (!preset) throw new Error(`${relative(root, file)}:${tag.line}: 不明なpresetです: ${config.preset}`)
      if (!schemas[preset.schema]) throw new Error(`${relative(root, file)}:${tag.line}: スキーマがありません: ${preset.schema}`)
      const csvPath = resolve(root, String(config.src))
      const csvRelative = relative(resolve(root), csvPath)
      if (csvRelative.startsWith('..') || isAbsolute(csvRelative)) throw new Error(`${relative(root, file)}:${tag.line}: src はプロジェクト内を指定してください: ${config.src}`)
      if (!existsSync(csvPath)) throw new Error(`${relative(root, file)}:${tag.line}: CSVがありません: ${config.src}`)
      const csv = readFileSync(csvPath, 'utf8')
      try { parseAndValidate(csv, schemas[preset.schema], { schemaName: preset.schema }) }
      catch (error) {
        if (error instanceof CsvError) throw new Error(`${relative(root, file)}:${tag.line}: ${config.src}: ${error.message}`)
        throw error
      }
      if (config.custom) throw new Error(`${relative(root, file)}:${tag.line}: custom Python レシピは廃止されました。標準プリセットを使用してください。`)
      const themePath = join(themesDir, `${config.theme}.json`)
      const theme = existsSync(themePath) ? readFileSync(themePath, 'utf8') : ''
      const id = figureHashFromConfig(config)
      const inputHash = hashString(canonical(config) + csv + JSON.stringify(preset) + theme)
      jobs.set(id, { id, config, csvPath, output: join(root, 'public', 'charts', `${id}.svg`), inputHash })
    }
  }
  return { jobs: [...jobs.values()], warnings }
}

function renderJobs(root, jobs) {
  if (!jobs.length) return
  const presets = readJson(presetsPath)
  const schemas = readJson(schemasPath)
  mkdirSync(join(root, 'public', 'charts'), { recursive: true })
  for (const job of jobs) {
    const themePath = join(themesDir, `${job.config.theme}.json`)
    const theme = existsSync(themePath) ? readJson(themePath) : readJson(join(themesDir, 'company.json'))
    const csv = readFileSync(job.csvPath, 'utf8')
    writeFileSync(job.output, renderFigure({ ...job, csv }, presets, schemas, theme))
  }
}

function generateAll(root, warn) {
  const { jobs, warnings } = collectJobs(root)
  warnings.forEach(warn)
  const cachePath = join(root, '.slidev', 'fig-cache.json')
  const cache = existsSync(cachePath) ? readJson(cachePath) : {}
  const pending = jobs.filter(job => cache[job.id] !== job.inputHash || !existsSync(job.output))
  renderJobs(root, pending)
  mkdirSync(dirname(cachePath), { recursive: true })
  writeFileSync(cachePath, JSON.stringify(Object.fromEntries(jobs.map(job => [job.id, job.inputHash])), null, 2))
  return { jobs, pending }
}

export function slidevCharts() {
  const buildId = Date.now().toString(36)
  return {
    name: 'slidev-charts',
    config() {
      generateAll(process.cwd(), message => console.warn(message))
      return { define: { __FIG_BUILD_ID__: JSON.stringify(buildId) } }
    },
    buildStart() { generateAll(process.cwd(), message => this.warn(message)) },
    configureServer(server) {
      const root = process.cwd()
      const generate = () => {
        try { generateAll(root, message => server.config.logger.warn(message)) }
        catch (error) { server.config.logger.error(error.message) }
      }
      generate()
      let timer
      const onChange = path => {
        if (!/\.(md|csv|json)$/.test(path)) return
        clearTimeout(timer)
        timer = setTimeout(() => { generate(); server.ws.send({ type: 'full-reload' }) }, 150)
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
