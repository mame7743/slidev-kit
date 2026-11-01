#!/usr/bin/env node
import { rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
for (const name of ['slidev-agent', 'slidev-charts', 'slidev-runner', 'slidev-core', 'slidev-mcp']) {
  rmSync(join(root, 'node_modules', name), { recursive: true, force: true })
}
rmSync(join(root, 'scripts', 'check.mjs'), { force: true })
for (const name of ['check.mjs', 'init.mjs', 'templates', 'layouts', 'interface', 'designs', 'components', 'composables', 'lib', 'setup', 'vite.config.ts']) {
  rmSync(join(root, name), { recursive: true, force: true })
}
