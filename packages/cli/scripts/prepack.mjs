#!/usr/bin/env node
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const workspace = resolve(root, '..')

// 各内部パッケージの実体と、CLI の node_modules/<name> へ同梱するエントリ。
const bundled = {
  'slidev-agent': ['agent', ['package.json', 'README.md', 'src']],
  'slidev-charts': ['theme/charts', ['package.json', 'README.md', 'components', 'src', 'templates', 'vite.config.ts']],
  'slidev-runner': ['runner', ['package.json', 'README.md', 'src']],
  'slidev-mcp': ['mcp', ['package.json', 'src']],
  'slidev-core': ['core', ['package.json', 'check.mjs', 'init.mjs', 'deck.mjs', 'deck.d.mts', 'templates', 'lib']],
}

// テーマ資産の唯一の実体 packages/theme から CLI ルートへ展開する。
// 配布tarballではこのパッケージ自身が `slidev-kit` テーマになる。
const themeRootAssets = ['public', 'layouts', 'interface', 'designs', 'components', 'composables', 'setup', 'scripts', 'vite.config.ts']
// packages/core の Node.js 資産も CLI ルートへ置く（template と checker は CLI 直下から解決される）。
const coreRootAssets = ['check.mjs', 'init.mjs', 'templates']

// 互換シンボリックリンクを実体へ展開して同梱する。
function copyTree(source, target, name) {
  if (source.includes('__pycache__') || source.includes(join(name, 'node_modules'))) return
  if (lstatSync(source).isSymbolicLink()) return copyTree(realpathSync(source), target, name)
  if (lstatSync(source).isDirectory()) {
    mkdirSync(target, { recursive: true })
    for (const entry of readdirSync(source)) copyTree(join(source, entry), join(target, entry), name)
    return
  }
  cpSync(source, target)
}

for (const [name, [dir, entries]] of Object.entries(bundled)) {
  const from = join(workspace, dir)
  const to = join(root, 'node_modules', name)
  rmSync(to, { recursive: true, force: true })
  mkdirSync(to, { recursive: true })
  for (const entry of entries) if (existsSync(join(from, entry))) copyTree(join(from, entry), join(to, entry), name)
  if (name === 'slidev-core') {
    // 単体tarballのcheckerは同梱slidev-coreのregistry/publicへフォールバックする。
    for (const entry of ['public', 'registry']) if (existsSync(join(workspace, 'theme', entry))) copyTree(join(workspace, 'theme', entry), join(to, entry), name)
  }
  console.log(`[prepack] ${name} -> ${to}`)
}

mkdirSync(join(root, 'scripts'), { recursive: true })
for (const entry of coreRootAssets) if (existsSync(join(workspace, 'core', entry))) copyTree(join(workspace, 'core', entry), join(root, entry), 'slidev-core')
copyTree(join(workspace, 'core', 'check.mjs'), join(root, 'scripts', 'check.mjs'), 'slidev-core')
// lib は core の deck-contract と theme の kit-presets / gantt / layout を合成する。
copyTree(join(workspace, 'core', 'lib'), join(root, 'lib'), 'slidev-core')
for (const entry of ['gantt', 'kit-presets.d.mts', 'kit-presets.mjs', 'layout']) if (existsSync(join(workspace, 'theme', 'lib', entry))) copyTree(join(workspace, 'theme', 'lib', entry), join(root, 'lib', entry), 'slidev-core')

for (const entry of themeRootAssets) if (existsSync(join(workspace, 'theme', entry))) copyTree(join(workspace, 'theme', entry), join(root, entry), 'slidev-kit')
