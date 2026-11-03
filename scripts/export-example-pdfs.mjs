import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const slidev = join(root, 'node_modules/@slidev/cli/bin/slidev.mjs')
const decks = ['quickstart', 'core-layouts', 'editorial-variant', 'all-layouts']

for (const name of decks) {
  const deck = `examples/${name}/slides.md`
  const output = `examples/${name}/exports/${name}.pdf`
  mkdirSync(dirname(join(root, output)), { recursive: true })
  const result = spawnSync(process.execPath, [slidev, 'export', deck, '--output', output, '--wait', '1000', '--timeout', '120000'], {
    cwd: root,
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
