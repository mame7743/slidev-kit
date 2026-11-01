import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, extname, join, resolve, win32 } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export function readConfig(root) {
  const file = join(root, 'slidev-kit.config.json')
  if (!existsSync(file)) {
    const legacy = join(root, 'deck.config.json')
    return existsSync(legacy) ? JSON.parse(readFileSync(legacy, 'utf8')) : {}
  }
  return JSON.parse(readFileSync(file, 'utf8'))
}

export function defaultDeck(root) {
  return readConfig(root).defaultDeck || 'slides.md'
}

export function exampleDecks(root) {
  const examples = readConfig(root).examples
  return Array.isArray(examples) ? examples : []
}

export function deckPath(root, file = 'slides.md', allowExamples = false) {
  const target = resolve(root, file)
  const rootDir = resolve(root)
  const examplesDir = resolve(root, 'examples')
  const allowed = dirname(target) === rootDir || (allowExamples && dirname(target) === examplesDir)
  if (!allowed || extname(target).toLowerCase() !== '.md')
    throw new Error('デッキはプロジェクト直下または examples/ の .md ファイルを指定してください。')
  return target
}

function deckRequire(root) {
  return createRequire(join(root, 'package.json'))
}

export function slidevCli(root = process.cwd()) {
  try {
    return deckRequire(root).resolve('@slidev/cli/bin/slidev.mjs')
  } catch {
    return require.resolve('@slidev/cli/bin/slidev.mjs')
  }
}

export function themeCheckPath(root = process.cwd()) {
  try {
    return deckRequire(root).resolve('slidev-template/check')
  } catch {}
  try {
    return require.resolve('slidev-template/check')
  } catch {
    return undefined
  }
}

export function windowsEdgeCandidates(env = process.env) {
  const roots = [
    env['PROGRAMFILES(X86)'],
    env['ProgramFiles(x86)'],
    env.ProgramFiles,
    env.PROGRAMFILES,
    env.LOCALAPPDATA,
    'C:\\Program Files (x86)',
    'C:\\Program Files',
  ].filter(Boolean)
  const candidates = []
  for (const root of roots) {
    for (const edition of ['Edge', 'Edge Beta', 'Edge Dev']) {
      candidates.push(win32.join(root, 'Microsoft', edition, 'Application', 'msedge.exe'))
    }
  }
  return [...new Set(candidates)]
}

export function chromiumPath(root = process.cwd()) {
  if (process.env.CHROMIUM_PATH) {
    if (!existsSync(process.env.CHROMIUM_PATH)) throw new Error('CHROMIUM_PATH のファイルが見つかりません。')
    return process.env.CHROMIUM_PATH
  }
  if (process.platform === 'win32') {
    for (const path of windowsEdgeCandidates()) {
      if (existsSync(path)) return path
    }
  }
  const requires = [deckRequire(root), require]
  for (const req of requires) {
    try {
      const { chromium } = req('playwright-chromium')
      const bundled = chromium.executablePath()
      if (existsSync(bundled)) return bundled
    } catch {}
  }
  for (const path of ['/usr/bin/chromium', '/usr/bin/chromium-browser'])
    if (existsSync(path)) return path
  return undefined
}

export function slidevArgs(command, file, extras = [], browser) {
  const stem = basename(file, extname(file))
  const isExample = file.replace(/\\/g, '/').replace(/^\.\//, '').startsWith('examples/')
  const supplied = flag => extras.some(arg => arg === flag || arg.startsWith(`${flag}=`))
  if (command === 'dev') return [file, ...extras]
  if (command === 'build') return ['build', file, ...(supplied('--out') ? [] : ['--out', isExample ? `../dist/${stem}` : `dist/${stem}`]), ...extras]
  if (command === 'export') return [
    'export', file, ...(supplied('--output') ? [] : ['--output', isExample ? `examples/${stem}.pdf` : `exports/${stem}.pdf`]),
    ...(browser ? ['--executable-path', browser] : []), ...extras,
  ]
  throw new Error(`不明な操作: ${command}`)
}
