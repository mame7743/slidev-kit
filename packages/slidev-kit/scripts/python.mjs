import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'

let cached

/** .venv / CHARTS_PYTHON / python / python3 の順に、matplotlibが使えるPythonを探す。 */
export function resolvePython(root = process.cwd()) {
  if (cached !== undefined) return cached
  const candidates = [
    process.env.CHARTS_PYTHON,
    join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'),
    'python',
    'python3',
  ].filter(Boolean)

  for (const candidate of candidates) {
    const executable = candidate.includes('/') || candidate.includes('\\')
      ? resolve(root, candidate)
      : candidate
    const result = spawnSync(executable, ['-c', 'import matplotlib'], { encoding: 'utf8' })
    if (result.status === 0) {
      cached = executable
      return cached
    }
  }
  cached = null
  return null
}
