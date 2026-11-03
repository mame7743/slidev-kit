import { afterAll, describe, expect, it } from 'vitest'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { checkDeck, registry, parseDeck, resolveDeckConfig, slideTokens } from '../lib/deck-contract.mjs'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const work = mkdtempSync(join(tmpdir(), 'kit-check-'))
mkdirSync(join(work, 'node_modules'))
symlinkSync(join(root, 'node_modules/@slidev'), join(work, 'node_modules/@slidev'), 'dir')
afterAll(() => rmSync(work, { recursive: true, force: true }))
const deck = (body = '# Actual title', extra = '', preset = 'corporate') => `---\nthemeConfig:\n  variant: ${preset}\nlayout: content\n${extra}---\n${body}\n`
function cli(source, expected = 0, flags = []) {
  writeFileSync(join(work, 'slides.md'), source)
  const result = spawnSync(process.execPath, [join(root, 'packages/cli/bin/cli.mjs'), 'build', 'slides.md', '--check-only', ...flags], { cwd: work, encoding: 'utf8' })
  expect(result.error).toBeUndefined()
  expect(result.status, result.stdout + result.stderr).toBe(expected)
  return result.stdout + result.stderr
}

describe('real CLI checker contracts', () => {
  it.each([['phase1', 'core-layouts'], ['phase2', 'editorial-variant']])('accepts %s sample via CLI entry', (phase, example) => {
    cli(readFileSync(join(root, `examples/${example}/slides.md`), 'utf8').replace('theme: ../../packages/theme', `theme: ${join(root, 'packages/theme')}`))
  })
  it('accepts H1, YAML mappings, structural variants, fences, and global density', () => {
    cli(deck('# Actual title\n\n```md\n::unknown::\n---\n```', 'variant: balanced\ndensity: compact\n'))
    cli('---\nlayout: content\nthemeConfig: { variant: editorial, density: relaxed }\n---\nActual title\n============\n')
  })
  it('accepts adjacent slot markers and bodies without blank lines', () => {
    cli(deck('# Actual title\n:: left ::\nLeft body\n::right::\nRight body').replace('layout: content', 'layout: split'))
    cli(deck('# Actual title\n\n    ::wrong::\n\n`::wrong::`'))
  })
  it.each([
    [deck('# Actual title\n:: wrong ::\nHidden body'), 'unknown slot: wrong'],
    [deck('# Actual title\n::wrong.name:part::\nHidden body'), 'unknown slot: wrong.name:part'],
    [deck('# Actual title\n::left::\n::right::\nRight body').replace('layout: content', 'layout: split'), 'empty required slot: left'],
    [deck('# Actual title\n::left::\nLeft body\n:: right ::').replace('layout: content', 'layout: split'), 'empty required slot: right'],
    [deck('# Actual title\n::left::\nA\n:: left ::\nB\n::right::\nC').replace('layout: content', 'layout: split'), 'duplicate slot: left'],
    [deck().replace('layout: content', 'layout: missing'), 'unknown layout'],
    [deck('# Actual title', 'variant: nope\n'), 'unsupported variant'],
    [deck('# Actual title', 'density: reading\n'), 'unsupported density'],
    [deck('# Actual title\n\n::wrong::\n\nText'), 'unknown slot'],
    [deck('Only text'), 'H1'],
    [deck('# Actual title\n\n::left::\n\n::right::\n\nText').replace('layout: content', 'layout: split'), 'empty required slot'],
    [deck('# Actual title\n\n```md\n::left::\n::right::\n```').replace('layout: content', 'layout: split'), 'missing required slot'],
    [deck('# Actual title\n\n::left::\n\nA\n\n::left::\n\nB\n\n::right::\n\nC').replace('layout: content', 'layout: split'), 'duplicate slot'],
    ['---\nlayout: [\n---\n# Invalid', 'slides.md'],
  ])('rejects invalid contract: %s', (source, message) => expect(cli(source, 1)).toContain(message))
  it('requires actual theme or user public assets; handles reference images and ignores code images', () => {
    cli(deck('# Actual title\n\n![Pipeline](/slidev-kit/pipeline.svg)'))
    cli(deck('# Actual title\n\n![Pipeline][p]\n\n[p]: /slidev-kit/pipeline.svg'))
    cli(deck('# Actual title\n\n```md\n![x](/missing.svg)\n```'))
    expect(cli(deck('# Actual title\n\n![x](/slidev-kit/missing.svg)'), 1)).toContain('パスがありません')
    expect(cli(deck('# Actual title\n\n![x](/user.svg)'), 1)).toContain('パスがありません')
    expect(cli(deck('# Actual title\n\n![x](missing.svg)'), 1)).toContain('パスがありません')
    writeFileSync(join(work, 'local.svg'), '<svg/>')
    cli(deck('# Actual title\n\n![x](local.svg)'))
    mkdirSync(join(work, 'public'), { recursive: true })
    writeFileSync(join(work, 'public/user.svg'), '<svg/>')
    cli(deck('# Actual title\n\n![x](/user.svg)'))
  })
  it.each(['default', 'mono', 'dark', 'acme'])('preserves legacy %s title/density/slot validation', preset => {
    if (preset === 'acme') cpSync(join(root, 'examples/design-contract/designs'), join(work, 'designs'), { recursive: true })
    cli(deck('Actual body\n\n::second::\n\nSecond body', 'title: Actual title\ndensity: presentation\n', preset))
    expect(cli(deck('# Actual title', '', preset), 1)).toContain('titleがありません')
    expect(cli(deck('Actual body', 'title: Actual title\ndensity: compact\n', preset), 1)).toContain('不明なdensity')
    expect(cli(deck('::wrong::', 'title: Actual title\n', preset), 1)).toContain('使えないスロット')
  })
  it('preserves example phrase checks and samples exception for Kit', () => {
    expect(cli(deck('# 資料タイトル'), 1)).toContain('例文が残っています')
    cli(deck('# 資料タイトル'), 0, ['--samples=slides.md'])
  })
  it('uses theme package defaults < config < direct headmatter, matching Slidev resolveConfig', async () => {
    const theme = join(work, 'theme')
    mkdirSync(theme)
    writeFileSync(join(theme, 'package.json'), JSON.stringify({ slidev: { defaults: { themeConfig: { variant: 'corporate', density: 'compact' } } } }))
    const source = `---\ntheme: ./theme\nlayout: content\n---\n# Actual title\n`
    cli(source)
    const parsed = await parseDeck(source)
    expect(resolveDeckConfig(parsed, join(work, 'slides.md')).themeConfig).toMatchObject({ variant: 'corporate', density: 'compact' })
    const configured = source.replace('layout: content', 'config:\n  themeConfig:\n    variant: editorial\n    density: relaxed\nlayout: content')
    cli(configured)
    expect(resolveDeckConfig(await parseDeck(configured), join(work, 'slides.md')).themeConfig).toMatchObject({ variant: 'editorial', density: 'relaxed' })
    expect(cli(source.replace('layout: content', 'themeConfig: { variant: missing }\nlayout: content\ntitle: Actual title'), 1)).toContain('不明なvariant')
    cli(source.replace('layout: content', 'config:\n  themeConfig:\n    variant: default\nthemeConfig:\n  variant: editorial\nlayout: content'))
    expect(cli(source.replace('layout: content', 'themeConfig:\n  variant: default\nlayout: content'), 1)).toContain('titleがありません')
    expect(cli(source.replace('layout: content', 'themeConfig:\n  density: tiny\nlayout: content'), 1)).toContain('unsupported density')
  })
  it('shares registry and parser behavior with authoring checks', async () => {
    expect(registry).toEqual(JSON.parse(readFileSync(join(root, 'packages/theme/registry/layouts.json'), 'utf8')))
    expect(await checkDeck(deck())).toEqual([])
  })
})

// Render with the installed Slidev plugin itself, not a second copy of our rule.
// Slidev 53 bundles this private plugin; isolate its self-contained source region.
const slidevRequire = createRequire(createRequire(import.meta.url).resolve('@slidev/cli/package.json'))
const { default: Markdown } = await import(pathToFileURL(slidevRequire.resolve('markdown-exit')).href)
const slidevDist = join(dirname(slidevRequire.resolve('@slidev/cli/package.json')), 'dist')
const slotPluginSource = readdirSync(slidevDist).filter(name => /^serve-.*\.mjs$/.test(name))
  .map(name => readFileSync(join(slidevDist, name), 'utf8'))
  .find(source => source.includes('//#region node/syntax/slot-sugar.ts'))
const slotRegion = slotPluginSource?.split('//#region node/syntax/slot-sugar.ts\n')[1]?.split('//#endregion')[0]
if (!slotRegion) throw new Error('Installed Slidev slot plugin source unavailable: update syntax parity test')
const slidevMarkdown = new Markdown().use(new Function(`${slotRegion}\nreturn MarkdownItSlotSugar`)())

describe('slot syntax matches installed Slidev render', () => {
  it.each([
    [':: wrong ::\nBody', ['wrong']],
    ['# Actual title\n::left::\nLeft body\n::right::\nRight body', ['left', 'right']],
    ['Before\n:: slot.name:part-1 ::\nAfter', ['slot.name:part-1']],
    ['::left::\n:: right ::', ['left', 'right']],
    ['::left::\nA\n:: left ::\nB', ['left', 'left']],
    ['```md\n::wrong::\n```\n\n~~~md\n::other::\n~~~', []],
    ['    ::wrong::\n\n`::other::`', []],
    [' ::indented::\nBody', []],
    ['Paragraph ::wrong::\n::not a slot::', []],
  ])('renders the same slot boundaries for %s', (content, expected) => {
    const rendered = slidevMarkdown.render(content)
    expect([...rendered.matchAll(/<template v-slot:([^=]+)=/g)].map(match => match[1])).toEqual(expected)
    expect(slideTokens({ content }).filter(token => token.type === 'slot_marker').map(token => token.meta.slotName)).toEqual(expected)
  })
})
