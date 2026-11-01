import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { deckPath, readConfig, slidevArgs, windowsEdgeCandidates } from '../src/deck-workflow.mjs'

const temporary = []
const workspace = () => {
  const root = mkdtempSync(join(tmpdir(), 'slidev authoring '))
  temporary.push(root)
  return root
}
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }) })

const cli = fileURLToPath(new URL('../src/cli.mjs', import.meta.url))
describe('authoring workflow', () => {
  it('prints help successfully without changing the workspace', () => {
    const result = spawnSync(process.execPath, [cli, '--help'], { cwd: workspace(), encoding: 'utf8' })
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('slidev-runner dev')
  })
  it('reads slidev-kit.config.json and falls back to deck.config.json', () => {
    const root = workspace()
    expect(readConfig(root)).toEqual({})
    writeFileSync(join(root, 'deck.config.json'), '{"defaultDeck": "legacy.md"}')
    expect(readConfig(root)).toEqual({ defaultDeck: 'legacy.md' })
    writeFileSync(join(root, 'slidev-kit.config.json'), '{"defaultDeck": "current.md"}')
    expect(readConfig(root)).toEqual({ defaultDeck: 'current.md' })
  })
  it('keeps local decks at the theme root', () => {
    const root = workspace()
    for (const file of ['../outside.md', 'nested/report.md', 'report.txt'])
      expect(() => deckPath(root, file)).toThrow()
  })
  it('allows bundled examples only for read and export commands', () => {
    const root = workspace()
    expect(deckPath(root, 'examples/slides.md', true)).toBe(join(root, 'examples/slides.md'))
    expect(() => deckPath(root, 'examples/slides.md')).toThrow()
    expect(slidevArgs('build', 'examples/slides.md')).toEqual(['build', 'examples/slides.md', '--out', '../dist/slides'])
    expect(slidevArgs('export', 'examples/slides.md')).toEqual(['export', 'examples/slides.md', '--output', 'examples/slides.pdf'])
  })
  it('builds Windows Edge candidates from standard install roots', () => {
    const paths = windowsEdgeCandidates({
      'PROGRAMFILES(X86)': 'C:\\Program Files (x86)',
      LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local',
    })
    expect(paths).toContain('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')
    expect(paths).toContain('C:\\Users\\me\\AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe')
    expect(paths).toContain('C:\\Program Files (x86)\\Microsoft\\Edge Beta\\Application\\msedge.exe')
  })

  it('keeps options as arguments and separates output for each deck', () => {
    expect(slidevArgs('dev', '設計 レビュー.md', ['--port', '4040'])).toEqual(['設計 レビュー.md', '--port', '4040'])
    expect(slidevArgs('build', 'report.md')).toEqual(['build', 'report.md', '--out', 'dist/report'])
    expect(slidevArgs('export', 'report.md', ['--range', '1-2'], '/browser path/chromium')).toEqual([
      'export', 'report.md', '--output', 'exports/report.pdf', '--executable-path', '/browser path/chromium', '--range', '1-2',
    ])
    expect(slidevArgs('build', 'report.md', ['--out', 'custom'])).toEqual(['build', 'report.md', '--out', 'custom'])
    expect(slidevArgs('export', 'report.md', ['--output=custom.pdf'])).toEqual(['export', 'report.md', '--output=custom.pdf'])
    expect(() => slidevArgs('unknown', 'report.md')).toThrow()
  })
})
