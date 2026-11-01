import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// 隔離環境で init → install → build を通す（テーマ無しの公開フローを検証）。
const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const work = mkdtempSync(join(tmpdir(), 'slidev-kit-e2e-'))
const cli = join(root, 'packages', 'slidev-kit', 'bin', 'cli.mjs')

function run(command, args, cwd) {
  return spawnSync(command, args, { cwd, encoding: 'utf8' })
}

try {
  writeFileSync(join(work, 'package.json'), JSON.stringify({ name: 'e2e', private: true, type: 'module' }))
  const init = run(process.execPath, [cli, 'init', 'demo', '--kit', `file:${root}`], work)
  if (init.status !== 0) throw new Error(`init 失敗:\n${init.stderr}`)
  const install = run('npm', ['install', '--ignore-scripts'], join(work, 'demo'))
  if (install.status !== 0) throw new Error(`install 失敗:\n${install.stderr}`)
  const build = run('npx', ['slidev-kit', 'build', 'slides.md'], join(work, 'demo'))
  if (build.status !== 0) throw new Error(`build 失敗:\n${build.stdout}\n${build.stderr}`)
  console.log('e2e OK: init → install → build')
} finally {
  rmSync(work, { recursive: true, force: true })
}
