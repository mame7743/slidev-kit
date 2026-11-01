#!/usr/bin/env node
import { rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
for (const name of ['slidev-agent', 'slidev-report']) {
  rmSync(join(root, 'node_modules', name), { recursive: true, force: true })
}
