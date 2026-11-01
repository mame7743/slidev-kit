import { afterEach, describe, expect, it } from 'vitest'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const temporary = []
const workspace = () => {
  const root = mkdtempSync(join(tmpdir(), 'slidev-kit init '))
  temporary.push(root)
  return root
}
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }) })

const initScript = fileURLToPath(new URL('../src/init.mjs', import.meta.url))

function run(root, args) {
  return spawnSync(process.execPath, [initScript, ...args], { cwd: root, encoding: 'utf8' })
}

function writeTemplate(root, name, files) {
  const dir = join(root, 'tpl', name)
  mkdirSync(dir, { recursive: true })
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(join(dir, file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : dir), { recursive: true })
    writeFileSync(join(dir, file), content)
  }
  return dir
}

describe('slidev-kit init', () => {
  it('creates a two-slide Markdown deck with safely quoted titles', () => {
    const root = workspace()
    const result = run(root, ['設計 レビュー.md', '--title', '評価: "試作A"'])
    expect(result.status, result.stderr).toBe(0)
    const source = readFileSync(join(root, '設計 レビュー.md'), 'utf8')
    expect(source).toContain('title: "評価: \\"試作A\\""')
    expect(source).toContain('theme: default')
    expect(source).toContain('layout: two-cols')
    expect(source).toContain('::right::')
  })
  it('never overwrites an existing deck', () => {
    const root = workspace()
    writeFileSync(join(root, 'report.md'), 'existing user work')
    const result = run(root, ['report.md'])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('上書きせず')
    expect(readFileSync(join(root, 'report.md'), 'utf8')).toBe('existing user work')
  })
  it('generates a standalone project without any closed theme dependency', () => {
    const root = workspace()
    const result = run(root, ['my-report'])
    expect(result.status, result.stderr).toBe(0)
    for (const file of ['slides.md', 'package.json', 'vite.config.ts', '.gitignore', 'README.md'])
      expect(existsSync(join(root, 'my-report', file))).toBe(true)
    expect(existsSync(join(root, 'my-report', 'template.json'))).toBe(false)
    for (const dir of ['data', 'public/images', 'ref'])
      expect(existsSync(join(root, 'my-report', dir, '.gitkeep'))).toBe(true)
    const pkg = JSON.parse(readFileSync(join(root, 'my-report', 'package.json'), 'utf8'))
    expect(pkg.name).toBe('my-report')
    expect(pkg.devDependencies['slidev-kit']).toBe('github:mame7743/slidev-kit#v0.1.0')
    expect(pkg.devDependencies['slidev-template']).toBeUndefined()
    expect(pkg.scripts.dev).toBe('slidev-kit slides.md --open')
    const again = run(root, ['my-report'])
    expect(again.status).toBe(1)
  })
  it('creates slides.md in place when no name is given without a TTY', () => {
    const root = workspace()
    const result = run(root, [])
    expect(result.status, result.stderr).toBe(0)
    expect(existsSync(join(root, 'slides.md'))).toBe(true)
    for (const dir of ['data', 'public/images', 'ref'])
      expect(existsSync(join(root, dir, '.gitkeep'))).toBe(true)
  })
  it('applies prompt defaults without a TTY and resolves --define overrides', () => {
    const root = workspace()
    writeTemplate(root, 'policy', {
      'template.json': JSON.stringify({
        tokens: ['classification', 'department'],
        prompts: [
          { token: 'classification', label: '分類', default: '社外秘' },
          { token: 'department', label: '部署名' },
        ],
      }),
      'slides.md': 'classification: {{classification}}\ndepartment: {{department}}\n',
    })
    const defaulted = run(root, ['a.md', '--template', './tpl/policy'])
    expect(defaulted.status, defaulted.stderr).toBe(0)
    expect(readFileSync(join(root, 'a.md'), 'utf8')).toBe('classification: 社外秘\ndepartment: {{department}}\n')
    expect(defaulted.stderr).toContain('{{department}}')
    const defined = run(root, ['b.md', '--template', './tpl/policy', '--define', 'department=品質管理部'])
    expect(defined.status, defined.stderr).toBe(0)
    expect(readFileSync(join(root, 'b.md'), 'utf8')).toBe('classification: 社外秘\ndepartment: 品質管理部\n')
  })
  it('replaces only tokens declared in the manifest', () => {
    const root = workspace()
    writeTemplate(root, 'mine', {
      'template.json': JSON.stringify({ name: 'mine', tokens: ['title'] }),
      'slides.md': 'title: {{title}}\nname: {{name}}\n',
    })
    const result = run(root, ['report.md', '--template', './tpl/mine'])
    expect(result.status, result.stderr).toBe(0)
    expect(readFileSync(join(root, 'report.md'), 'utf8')).toBe('title: "report"\nname: {{name}}\n')
  })
  it('copies templates without a manifest verbatim and warns', () => {
    const root = workspace()
    writeTemplate(root, 'plain', { 'slides.md': 'title: {{title}}\n' })
    const result = run(root, ['report.md', '--template', './tpl/plain'])
    expect(result.status, result.stderr).toBe(0)
    expect(readFileSync(join(root, 'report.md'), 'utf8')).toBe('title: {{title}}\n')
    expect(result.stderr).toContain('template.json')
  })
  it('resolves custom tokens from --define and {{date}} from today', () => {
    const root = workspace()
    writeTemplate(root, 'policy', {
      'template.json': JSON.stringify({ tokens: ['date', 'classification'] }),
      'slides.md': 'date: {{date}}\nclassification: {{classification}}\n',
    })
    const result = run(root, ['report.md', '--template', './tpl/policy', '--define', 'classification=社外秘'])
    expect(result.status, result.stderr).toBe(0)
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(readFileSync(join(root, 'report.md'), 'utf8')).toBe(`date: ${today}\nclassification: 社外秘\n`)
  })
  it('skips scaffold files and ref/ in inplace mode', () => {
    const root = workspace()
    writeTemplate(root, 'full', {
      'template.json': JSON.stringify({ tokens: ['title'], scaffoldFiles: ['package.json', 'README.md'] }),
      'slides.md': 'title: {{title}}\n',
      'package.json': '{ "name": "scaffold" }',
      'README.md': 'readme',
      'ref/secret.md': 'should not be copied',
      'data/notes.csv': 'a,b\n1,2\n',
    })
    const result = run(root, ['report.md', '--template', './tpl/full'])
    expect(result.status, result.stderr).toBe(0)
    expect(existsSync(join(root, 'package.json'))).toBe(false)
    expect(existsSync(join(root, 'README.md'))).toBe(false)
    expect(existsSync(join(root, 'ref', 'secret.md'))).toBe(false)
    expect(readFileSync(join(root, 'data', 'notes.csv'), 'utf8')).toBe('a,b\n1,2\n')
    expect(result.stderr).toContain('ref/')
  })
  it('copies scaffold files and data in project mode but never ref/', () => {
    const root = workspace()
    writeTemplate(root, 'full', {
      'template.json': JSON.stringify({ tokens: ['title', 'name'], scaffoldFiles: ['package.json', 'README.md'] }),
      'slides.md': 'title: {{title}}\n',
      'package.json': '{ "name": "{{name}}" }',
      'README.md': 'readme for {{name}}',
      'ref/secret.md': 'should not be copied',
      'data/notes.csv': 'label,{{title}}\n',
    })
    const result = run(root, ['demo', '--template', './tpl/full'])
    expect(result.status, result.stderr).toBe(0)
    expect(readFileSync(join(root, 'demo', 'package.json'), 'utf8')).toBe('{ "name": "demo" }')
    expect(readFileSync(join(root, 'demo', 'README.md'), 'utf8')).toBe('readme for demo')
    expect(readFileSync(join(root, 'demo', 'data', 'notes.csv'), 'utf8')).toBe('label,{{title}}\n')
    expect(existsSync(join(root, 'demo', 'ref', 'secret.md'))).toBe(false)
    expect(existsSync(join(root, 'demo', 'ref', '.gitkeep'))).toBe(true)
    expect(result.stderr).toContain('ref/')
  })
  it('provides the system scaffold when the template lacks package.json', () => {
    const root = workspace()
    writeTemplate(root, 'minimal', {
      'template.json': JSON.stringify({ tokens: ['title', 'name'] }),
      'slides.md': 'title: {{title}}\n',
    })
    const result = run(root, ['demo', '--template', './tpl/minimal'])
    expect(result.status, result.stderr).toBe(0)
    const pkg = JSON.parse(readFileSync(join(root, 'demo', 'package.json'), 'utf8'))
    expect(pkg.name).toBe('demo')
    expect(pkg.scripts.dev).toBe('slidev-kit slides.md --open')
    for (const file of ['vite.config.ts', '.gitignore', 'README.md'])
      expect(existsSync(join(root, 'demo', file))).toBe(true)
  })
  it('rejects modes not declared in the manifest', () => {
    const root = workspace()
    writeTemplate(root, 'projonly', {
      'template.json': JSON.stringify({ modes: ['project'], tokens: ['title', 'name'] }),
      'slides.md': 'title: {{title}}\n',
      'package.json': '{ "name": "{{name}}" }',
    })
    const result = run(root, ['report.md', '--template', './tpl/projonly'])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('inplace')
  })
  it('lists bundled templates with slidev-kit init --list', () => {
    const root = workspace()
    const result = run(root, ['--list'])
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toContain('default')
    expect(result.stdout).toContain('bundled')
    expect(result.stdout).toContain('Slidev標準テーマの2ページ雛形')
    expect(result.stdout).not.toContain('corporate')
  })
})
