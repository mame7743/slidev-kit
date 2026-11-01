#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { resolvePython } from './python.mjs'

// 作り込んだ図のレシピはデザインテンプレート側（プロジェクトの scripts/charts/run.py）。
const recipe = join(process.cwd(), 'scripts', 'charts', 'run.py')
const python = resolvePython(process.cwd())
if (!python) {
  console.error('matplotlibが使えるPythonが見つかりません。.venv を作成するか CHARTS_PYTHON を設定してください。')
  process.exit(1)
}
const result = spawnSync(python, [recipe], { cwd: process.cwd(), stdio: 'inherit' })
process.exit(result.status ?? 1)
