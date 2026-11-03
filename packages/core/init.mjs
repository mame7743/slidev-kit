#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'

const require = createRequire(import.meta.url)
let workflow
try {
  workflow = require('slidev-runner/deck-workflow')
} catch {
  workflow = await import('../runner/src/deck-workflow.mjs')
}
const { readConfig } = workflow

// テンプレート規約:
// - manifest template.json（name / description / modes / tokens / prompts / scaffoldFiles）を置ける
// - tokens に宣言されたトークンだけ置換する（未宣言の {{...}} はそのまま残す）
// - テキストファイルのみ置換（md txt json ts js mjs cjs css scss html vue yaml yml と拡張子なし）
// - 標準構成はシステム側で用意: data/ public/images/ ref/（空）+ templates/scaffold/ の足場
// - テンプレートは slides.md と data/ public/images/ への追加コンテンツを提供する
// - ref/ はユーザ専有。テンプレートからは配布しない（コピー対象外）
// - scaffoldFiles（既定: package.json vite.config.ts .npmrc .gitignore README.md）は project モードのみ
// - TTYでは対話（テンプレート選択 → デッキ名 → タイトル → prompts）。非TTYではフラグと既定値
const deckRoot = resolve(dirname(fileURLToPath(import.meta.url)))
const SYSTEM_SCAFFOLD = join(deckRoot, 'templates', 'scaffold')
const STANDARD_DIRS = ['data', join('public', 'images'), 'ref']
const DEFAULT_SLIDEV = '^53.0.0'
// 配布はnpmレジストリではなく、バージョン付きのGitHub Release asset (.tgz)。
// 実行中のCLI自身のバージョンから導入URLを組み立てる。
function cliVersion() {
  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = []
  try { candidates.push(require.resolve('slidev-kit/package.json')) } catch {}
  // 開発: packages/core -> packages/cli/package.json
  candidates.push(join(here, '..', 'cli', 'package.json'))
  // 同梱tarball: node_modules/slidev-core -> slidev-kit/package.json
  candidates.push(join(here, '..', '..', 'package.json'))
  for (const file of candidates) {
    if (!existsSync(file)) continue
    try { return JSON.parse(readFileSync(file, 'utf8')).version } catch {}
  }
  return '0.2.2'
}
const CLI_VERSION = cliVersion()
const DEFAULT_RELEASE = `https://github.com/mame7743/slidev-kit/releases/download/v${CLI_VERSION}/slidev-kit-${CLI_VERSION}.tgz`
const DEFAULT_THEME = DEFAULT_RELEASE
const DEFAULT_KIT_DEP = DEFAULT_RELEASE
const DEFAULT_SCAFFOLD = ['package.json', 'vite.config.ts', '.npmrc', '.gitignore', 'README.md']
const TEXT_EXTENSIONS = new Set(['md', 'txt', 'json', 'ts', 'js', 'mjs', 'cjs', 'css', 'scss', 'html', 'vue', 'yaml', 'yml'])

const args = process.argv.slice(2)
const flags = new Map()
const defines = []
const positional = []
for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg === '--define') {
    const value = args[++i]
    if (!value || !value.includes('=')) throw new Error('--define は key=value で指定してください（例: --define classification=社外秘）。')
    defines.push([value.slice(0, value.indexOf('=')), value.slice(value.indexOf('=') + 1)])
  } else if (arg.startsWith('--define=')) {
    const value = arg.slice('--define='.length)
    if (!value.includes('=')) throw new Error('--define は key=value で指定してください（例: --define classification=社外秘）。')
    defines.push([value.slice(0, value.indexOf('=')), value.slice(value.indexOf('=') + 1)])
  } else if (arg.startsWith('--')) {
    const eq = arg.indexOf('=')
    if (eq > 0) flags.set(arg.slice(2, eq), arg.slice(eq + 1))
    else flags.set(arg.slice(2), args[++i] ?? 'true')
  } else positional.push(arg)
}

const usage = `使い方:
  slidev-kit init                         対話でテンプレート選択・デッキ名・タイトルを入力
  slidev-kit init report.md [--title "..."]   現在のプロジェクトへ指定ファイルで作成
  slidev-kit init my-report               独立したプロジェクト my-report/ を生成
  slidev-kit init --list                  利用可能なテンプレートを一覧表示
  --template=<name|path|github:owner/repo#ref> テンプレートを指定（GitHubはslides.mdをリポジトリ直下に配置）
  --theme=<tarballURL|file:path>     テーマ依存の指定（既定: GitHub Release tarball）
  --slidev=<version>                @slidev/cli のバージョン（既定 ^53.0.0）
  --kit=<spec>                      slidev-kit の依存指定（既定: GitHub Release tarball）
  --define <key>=<value>            任意トークンを指定（繰り返し可）
トークン: {{name}} {{title}} {{themeDep}} {{slidevVersion}} {{kitDep}} {{date}}（{{title}} は引用済み）
標準構成: slides.md / ref/ / data/ / public/images/ / package.json ほか（システムが用意）
`

function configTemplatesDir(root) {
  const value = readConfig(root).templates
  return value ? resolve(root, String(value)) : undefined
}

function userTemplatesDirs() {
  // 旧名（~/.config/deck/templates）からの移行を許容する。
  return [join(homedir(), '.config', 'slidev-kit', 'templates'), join(homedir(), '.config', 'deck', 'templates')]
}

function templateSources(root) {
  const sources = []
  if (configTemplatesDir(root)) sources.push({ dir: configTemplatesDir(root), label: 'config' })
  for (const dir of userTemplatesDirs()) sources.push({ dir, label: 'user' })
  sources.push({ dir: join(deckRoot, 'templates'), label: 'bundled' })
  return sources
}

function isTemplateDir(path) {
  return existsSync(join(path, 'slides.md')) || existsSync(join(path, 'template.json'))
}

function readManifest(dir) {
  const file = join(dir, 'template.json')
  if (!existsSync(file)) return undefined
  const value = JSON.parse(readFileSync(file, 'utf8'))
  const manifest = {
    name: typeof value.name === 'string' ? value.name : undefined,
    description: typeof value.description === 'string' ? value.description : undefined,
    modes: Array.isArray(value.modes) ? value.modes : undefined,
    tokens: Array.isArray(value.tokens) ? value.tokens : [],
    prompts: Array.isArray(value.prompts) ? value.prompts : [],
    scaffoldFiles: Array.isArray(value.scaffoldFiles) ? value.scaffoldFiles : DEFAULT_SCAFFOLD,
  }
  for (const prompt of manifest.prompts) {
    if (typeof prompt !== 'object' || typeof prompt.token !== 'string') throw new Error(`template.json の prompts が不正です: ${JSON.stringify(prompt)}`)
    if (!manifest.tokens.includes(prompt.token)) throw new Error(`prompts の token は tokens にも宣言してください: {{${prompt.token}}}`)
  }
  return manifest
}

function listTemplates(root) {
  const rows = []
  const seen = new Set()
  for (const source of templateSources(root)) {
    if (!existsSync(source.dir)) continue
    for (const entry of readdirSync(source.dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || !isTemplateDir(join(source.dir, entry.name))) continue
      const manifest = readManifest(join(source.dir, entry.name))
      const key = manifest?.name || entry.name
      if (seen.has(key)) continue
      seen.add(key)
      rows.push({
        name: key,
        description: manifest?.description ?? '',
        modes: manifest?.modes?.join(',') ?? 'inplace,project',
        source: source.label,
      })
    }
  }
  return rows
}

function resolveTemplateDir(requested, root) {
  const github = /^github:([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)(?:\/([^#]+))?(?:#([A-Za-z0-9._/-]+))?$/.exec(requested || '')
  if (github) {
    const [, repo, subpath = '', requestedRef = 'main'] = github
    const ref = requestedRef.replace(/\.git$/, '')
    if (ref.startsWith('-') || ref.includes('..')) throw new Error(`不正なGit refです: ${ref}`)
    if (subpath && subpath.split('/').some(part => !part || part === '.' || part === '..')) throw new Error(`不正なテンプレートパスです: ${subpath}`)
    const key = createHash('sha256').update(`${repo}#${ref}`).digest('hex').slice(0, 16)
    const cache = join(homedir(), '.cache', 'slidev-kit', 'github-templates', key)
    mkdirSync(dirname(cache), { recursive: true })
    rmSync(cache, { recursive: true, force: true })
    const result = spawnSync('git', ['clone', '--depth', '1', '--filter=blob:none', '--branch', ref, `https://github.com/${repo.replace(/\.git$/, '')}.git`, cache], { encoding: 'utf8', timeout: 120_000 })
    if (result.status !== 0) throw new Error(`GitHubテンプレート取得失敗（${repo}#${ref}）。git とネットワークを確認してください。\n${(result.stderr || result.stdout || '').trim()}`)
    const template = resolve(cache, subpath || '.')
    const relativeTemplate = relative(cache, template)
    if (relativeTemplate.startsWith('..') || isAbsolute(relativeTemplate)) throw new Error(`不正なテンプレートパスです: ${subpath}`)
    if (!isTemplateDir(template)) throw new Error(`GitHubテンプレートに slides.md または template.json がありません: ${repo}/${subpath}#${ref}`)
    return template
  }
  if (requested?.startsWith('github:')) throw new Error('GitHubテンプレートは github:owner/repo/path/to/template#tag の形式で指定してください。')
  const looksLikePath = requested && (requested.startsWith('.') || requested.startsWith('/') || requested.includes('\\'))
  if (looksLikePath) {
    const dir = resolve(root, requested)
    if (isTemplateDir(dir)) return dir
    throw new Error(`テンプレートが見つかりません: ${requested}`)
  }
  for (const source of templateSources(root)) {
    if (!existsSync(source.dir)) continue
    const dir = requested ? join(source.dir, requested) : join(source.dir, 'default')
    if (isTemplateDir(dir)) return dir
  }
  throw new Error(`テンプレートが見つかりません: ${requested || 'default'}`)
}

function render(text, tokens, declared) {
  if (!declared.size) return text
  return text.replace(/\{\{(\w+)\}\}/g, (_all, key) => (declared.has(key) && key in tokens ? tokens[key] : `{{${key}}}`))
}

function isTextFile(path) {
  const ext = extname(path).slice(1).toLowerCase()
  return ext === '' || TEXT_EXTENSIONS.has(ext)
}

function copyTree(template, target, { mode, manifest, tokens, declared, skipped, unresolved }) {
  const scaffold = new Set(manifest?.scaffoldFiles ?? DEFAULT_SCAFFOLD)
  const walk = (from, to) => {
    for (const entry of readdirSync(from, { withFileTypes: true })) {
      if (entry.name === 'template.json') continue
      const source = join(from, entry.name)
      const destination = join(to, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'ref') {
          console.warn(`[slidev-kit init] ref/ はユーザ専有のためコピーしません: ref/`)
          continue
        }
        mkdirSync(destination, { recursive: true })
        walk(source, destination)
        continue
      }
      if (mode === 'inplace' && scaffold.has(entry.name)) continue
      if (mode === 'inplace' && entry.name === 'slides.md') continue
      if (existsSync(destination)) {
        skipped.push(entry.name)
        continue
      }
      if (isTextFile(entry.name)) {
        const sourceText = readFileSync(source, 'utf8')
        const output = render(sourceText, tokens, declared)
        for (const key of declared) if (!(key in tokens) && sourceText.includes(`{{${key}}}`)) unresolved.add(key)
        writeFileSync(destination, output, { flag: 'wx' })
      } else {
        cpSync(source, destination)
      }
    }
  }
  walk(template, target)
}

function copySystemScaffold(target, tokens) {
  if (!existsSync(SYSTEM_SCAFFOLD)) return
  const declared = new Set([...Object.keys(tokens)])
  for (const entry of readdirSync(SYSTEM_SCAFFOLD)) {
    const source = join(SYSTEM_SCAFFOLD, entry)
    const destination = join(target, entry)
    if (existsSync(destination)) continue
    if (isTextFile(entry)) {
      writeFileSync(destination, render(readFileSync(source, 'utf8'), tokens, declared), { flag: 'wx' })
    } else {
      cpSync(source, destination)
    }
  }
}

function ensureStandardDirs(target) {
  for (const dir of STANDARD_DIRS) {
    const path = join(target, dir)
    mkdirSync(path, { recursive: true })
    try {
      writeFileSync(join(path, '.gitkeep'), '', { flag: 'wx' })
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
    }
  }
}

const interactive = Boolean(process.stdin.isTTY)
let rl

async function ask(label, fallback) {
  rl ??= createInterface({ input, output })
  const suffix = fallback !== undefined ? ` [${fallback}]` : ''
  const answer = (await rl.question(`${label}${suffix}: `)).trim()
  return answer === '' && fallback !== undefined ? fallback : answer
}

function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

async function main() {
  if (positional.length > 1) throw new Error(usage)
  if (flags.get('help') || flags.get('h')) {
    console.log(usage)
    return
  }
  if (flags.get('list')) {
    const rows = listTemplates(process.cwd())
    if (!rows.length) {
      console.log('テンプレートがありません。')
    } else {
      for (const row of rows) console.log(`${row.name}\t${row.modes}\t${row.source}\t${row.description}`)
    }
    return
  }

  // 1. テンプレート選択（複数あるときは対話、1つなら自動、非TTYは既定値）
  const requestedTemplate = flags.get('template')
  let template
  if (requestedTemplate) {
    template = resolveTemplateDir(requestedTemplate, process.cwd())
  } else if (interactive) {
    const rows = listTemplates(process.cwd())
    if (!rows.length) throw new Error('テンプレートがありません。')
    if (rows.length === 1) {
      template = resolveTemplateDir(rows[0].name, process.cwd())
      console.log(`テンプレート: ${rows[0].name}（${rows[0].description}）`)
    } else {
      console.log('テンプレートを選択してください:')
      rows.forEach((row, index) => console.log(`  ${index + 1}) ${row.name}\t${row.description}`))
      const answer = await ask('選択', '1')
      const index = /^\d+$/.test(answer) ? Number(answer) - 1 : rows.findIndex((row) => row.name === answer)
      if (index < 0 || index >= rows.length) throw new Error(`不明なテンプレートです: ${answer}`)
      template = resolveTemplateDir(rows[index].name, process.cwd())
    }
  } else {
    template = resolveTemplateDir(undefined, process.cwd())
  }
  const manifest = readManifest(template)
  if (!manifest) console.warn('[slidev-kit init] template.json がありません。トークンは置換されません。')

  // 2. デッキ名（対話では既定 slides.md = 現在地へ作成）
  let deckName = positional[0]
  if (!deckName && interactive) deckName = await ask('デッキ名（.md で終わると現在のディレクトリへ作成）', 'slides.md')
  deckName ??= 'slides.md'
  const mode = deckName.endsWith('.md') ? 'inplace' : 'project'
  if (manifest?.modes && !manifest.modes.includes(mode)) {
    throw new Error(`テンプレート ${manifest.name || template} は ${mode} モードに対応していません（${manifest.modes.join(', ')}）。`)
  }

  // 3. タイトル（--title があれば対話しない）
  const rawDefaultTitle = deckName.endsWith('.md') ? basename(deckName, extname(deckName)) : deckName
  let title = flags.get('title')
  if (!title && interactive) title = await ask('資料タイトル', rawDefaultTitle)
  title ??= rawDefaultTitle

  const tokens = {
    name: deckName.endsWith('.md') ? basename(deckName, extname(deckName)) : deckName,
    title: JSON.stringify(title),
    themeDep: flags.get('theme') ?? DEFAULT_THEME,
    kitDep: flags.get('kit') ?? DEFAULT_KIT_DEP,
    slidevVersion: flags.get('slidev') ?? DEFAULT_SLIDEV,
    date: today(),
  }
  for (const [key, value] of defines) tokens[key] = value

  // 4. manifest の prompts（対話で入力。非TTYでは既定値、フラグ指定済みはスキップ）
  for (const prompt of manifest?.prompts ?? []) {
    if (prompt.token in tokens) continue
    if (interactive) {
      const label = prompt.label || prompt.token
      let value = await ask(label, prompt.default)
      if (value === '' && prompt.default === undefined) value = await ask(label, undefined)
      if (value !== '') tokens[prompt.token] = value
    } else if (prompt.default !== undefined) {
      tokens[prompt.token] = prompt.default
    }
  }

  const declared = new Set(manifest ? manifest.tokens : [])
  const skipped = []
  const unresolved = new Set()

  if (mode === 'inplace') {
    const file = deckName
    if (extname(file).toLowerCase() !== '.md') throw new Error('ファイル名は .md にしてください。')
    const slidesPath = join(template, 'slides.md')
    if (!existsSync(slidesPath)) throw new Error(`テンプレートに slides.md がありません: ${template}`)
    const target = resolve(process.cwd(), file)
    if (existsSync(target)) throw new Error('同名のデッキが既にあります。上書きせず終了しました。')
    const sourceText = readFileSync(slidesPath, 'utf8')
    const output = render(sourceText, tokens, declared)
    for (const key of declared) if (!(key in tokens) && sourceText.includes(`{{${key}}}`)) unresolved.add(key)
    writeFileSync(target, output, { flag: 'wx' })
    copyTree(template, resolve(process.cwd()), { mode, manifest, tokens, declared, skipped, unresolved })
    ensureStandardDirs(process.cwd())
    console.log(`作成しました: ${file}`)
    console.log(`次の手順: slidev-kit ${JSON.stringify(file)}`)
  } else {
    const target = resolve(process.cwd(), deckName)
    if (existsSync(target)) throw new Error('同名のフォルダが既にあります。上書きせず終了しました。')
    mkdirSync(target, { recursive: true })
    copyTree(template, target, { mode, manifest, tokens, declared, skipped, unresolved })
    copySystemScaffold(target, tokens)
    ensureStandardDirs(target)
    console.log(`デッキを作成しました: ${target}`)
    console.log('次の手順:')
    console.log(`  cd ${deckName}`)
    console.log('  npm install')
    console.log('  npm run dev')
  }

  if (skipped.length) console.warn(`[slidev-kit init] 既存ファイルのためスキップしました: ${skipped.join(', ')}`)
  if (unresolved.size) console.warn(`[slidev-kit init] 値が未指定のトークンがあります: ${[...unresolved].map((key) => `{{${key}}}`).join(', ')}`)
}

main().then(
  () => rl?.close(),
  (error) => {
    rl?.close()
    console.error(error.code === 'EEXIST' ? '同名のデッキが既にあります。上書きせず終了しました。' : error.message)
    process.exitCode = 1
  },
)
