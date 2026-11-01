#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// 1パッケージ配布用に、workspace の内部パッケージを node_modules へ実体コピーする。
// npm は workspace の symlink を bundleDependencies に含めないため、prepack で実体化する。
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const workspace = resolve(root, '..')
const packages = {
  'slidev-agent': ['package.json', 'README.md', 'src'],
  'slidev-report': ['package.json', 'README.md', 'src'],
}

for (const [name, entries] of Object.entries(packages)) {
  const from = join(workspace, name)
  const to = join(root, 'node_modules', name)
  rmSync(to, { recursive: true, force: true })
  mkdirSync(to, { recursive: true })
  for (const entry of entries) {
    if (!existsSync(join(from, entry))) continue
    cpSync(join(from, entry), join(to, entry), {
      recursive: true,
      filter: (source) => !source.includes('__pycache__') && !source.includes(`${join(name, 'node_modules')}`),
    })
  }
  console.log(`[prepack] ${name} -> ${to}`)
}
