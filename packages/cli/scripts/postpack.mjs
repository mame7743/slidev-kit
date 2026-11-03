#!/usr/bin/env node
import { rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
for (const name of ['slidev-agent', 'slidev-charts', 'slidev-runner', 'slidev-core', 'slidev-mcp']) {
  rmSync(join(root, 'node_modules', name), { recursive: true, force: true })
}
// prepack が scripts/ へコピーする生成物のみ削除する（prepack.mjs / postpack.mjs は残す）。
for (const name of ['check.mjs', 'vite-plugin-charts.mjs']) {
  rmSync(join(root, 'scripts', name), { force: true })
}
// prepack が CLI ルートへコピーする生成物（deck.mjs / deck.d.mts は追跡済みのため残す）。
for (const name of ['check.mjs', 'init.mjs', 'public', 'templates', 'layouts', 'interface', 'designs', 'components', 'composables', 'lib', 'setup', 'vite.config.ts']) {
  rmSync(join(root, name), { recursive: true, force: true })
}
