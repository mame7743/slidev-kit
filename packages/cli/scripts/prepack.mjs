#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const workspace = resolve(root, '..')
const packages = {
  'slidev-agent': ['package.json', 'README.md', 'src'],
  'slidev-charts': ['package.json', 'README.md', 'components', 'src', 'templates', 'vite.config.ts'],
  'slidev-runner': ['package.json', 'README.md', 'src'],
  'slidev-mcp': ['package.json', 'src'],
  'slidev-core': ['package.json', 'check.mjs', 'init.mjs', 'deck.mjs', 'deck.d.mts', 'templates', 'layouts', 'interface', 'designs', 'components', 'composables', 'lib', 'setup', 'scripts', 'vite.config.ts'],
}

for (const [name, entries] of Object.entries(packages)) {
  const sourceName = { 'slidev-core': 'core', 'slidev-runner': 'runner', 'slidev-agent': 'agent', 'slidev-charts': 'charts', 'slidev-mcp': 'mcp' }[name] ?? name
  const from = join(workspace, sourceName)
  const to = join(root, 'node_modules', name)
  rmSync(to, { recursive: true, force: true })
  mkdirSync(to, { recursive: true })
  for (const entry of entries) if (existsSync(join(from, entry))) cpSync(join(from, entry), join(to, entry), { recursive: true, filter: (source) => !source.includes('__pycache__') && !source.includes(`${join(name, 'node_modules')}`) })
  if (name === 'slidev-core') {
    for (const entry of entries.slice(1)) if (existsSync(join(from, entry))) cpSync(join(from, entry), join(root, entry), { recursive: true })
    cpSync(join(from, 'check.mjs'), join(root, 'scripts', 'check.mjs'))
  }
  console.log(`[prepack] ${name} -> ${to}`)
}
