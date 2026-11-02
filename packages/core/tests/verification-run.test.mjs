import { describe, expect, it } from 'vitest'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { startVerification } from '../../../scripts/phase2/verification-run.mjs'

const root = fileURLToPath(new URL('../../../', import.meta.url))
describe('verification artifact lifecycle', () => {
  it.each([
    ['verify-cli-distribution.mjs', 'phase2-distribution/fixed'],
    ['verify-legacy-browser.mjs', 'phase2-legacy'],
    ['verify-cli-kit.mjs', 'phase2-cli-kit'],
  ])('%s never advertises stale success after a failed rerun', (script, directory) => {
    const work = mkdtempSync(join(tmpdir(), 'verification-lifecycle-'))
    try {
      mkdirSync(join(work, 'scripts/phase2'), { recursive: true })
      for (const file of [script, 'verification-run.mjs']) cpSync(join(root, 'scripts/phase2', file), join(work, 'scripts/phase2', file))
      symlinkSync(join(root, 'node_modules'), join(work, 'node_modules'), 'dir')
      const base = join(work, 'dist', directory)
      const first = startVerification(base)
      expect(JSON.parse(readFileSync(join(base, 'latest.json'))).status).toBe('running')
      writeFileSync(join(first.output, 'old.html'), 'previous success')
      first.succeed({ test: true })
      expect(JSON.parse(readFileSync(join(base, 'latest.json'))).status).toBe('success')
      const failed = spawnSync(process.execPath, [join(work, 'scripts/phase2', script), '--fail-after-start'], { cwd: work, encoding: 'utf8' })
      expect(failed.status, failed.stderr).toBe(1)
      const latest = JSON.parse(readFileSync(join(base, 'latest.json')))
      expect(latest.status).toBe('failed')
      expect(latest.error).toContain('Intentional verification failure')
      expect(latest.output).not.toBe(first.output)
      expect(latest.report).toBeUndefined()
      expect(existsSync(join(latest.output, 'report.json'))).toBe(false)
      expect(existsSync(join(latest.output, 'old.html'))).toBe(false)
      expect(existsSync(join(first.output, 'old.html'))).toBe(true)
    } finally { rmSync(work, { recursive: true, force: true }) }
  })
})
