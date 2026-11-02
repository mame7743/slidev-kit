import { describe, it, expect } from 'vitest'
import { checkDeck, registry, slideTemplate, sampleDeck, root } from '../../../scripts/phase1/phase1-lib.mjs'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const added = registry.slice(10)
const deck = (id, body) => `---\nlayout: ${id}\n---\n${body}`
describe('Phase2 expansion contracts', () => {
  it('appends only the seven implemented IDs, preserving original ten fixtures', async () => {
    expect(added.map(x => x.id)).toEqual(['agenda', 'summary', 'end', 'quote', 'metrics', 'process', 'code'])
    expect(registry).toHaveLength(17)
    expect(readFileSync(join(root, 'examples/phase1/slides.md'), 'utf8')).toBe(sampleDeck())
    expect(readFileSync(join(root, 'examples/phase2-expansion/slides.md'), 'utf8')).toBe(sampleDeck(registry))
    for (const item of added) {
      expect(item.variants).toEqual(['balanced'])
      expect(await checkDeck(slideTemplate(item))).toEqual([])
    }
  })
  it('requires exactly one H1 before slots only for new contracts', async () => {
    for (const item of added) {
      expect((await checkDeck(slideTemplate(item).replace(item.markdown, item.markdown + '\n\n# Duplicate'))).join()).toContain('exactly one')
      if (item.slots.length) {
        const moved = item.markdown.replace(/^# .*\n/, '') + '\n\n# Late title'
        expect((await checkDeck(deck(item.id, moved))).join()).toContain('precede')
      }
    }
    expect(await checkDeck(deck('content', '# First\n\n# Second'))).toEqual([])
  })
  it('rejects missing, duplicate, unknown, heading-only and comment-only slots', async () => {
    for (const item of added.filter(x => x.slots.length)) {
      const first = item.slots[0].name
      expect((await checkDeck(deck(item.id, '# Title'))).join()).toContain('missing required slot')
      for (const empty of ['## Heading only', '<!-- comment -->']) {
        const body = '# Title\n\n' + item.slots.map(s => `::${s.name}::\n\n${empty}`).join('\n\n')
        expect((await checkDeck(deck(item.id, body))).join()).toContain('empty required slot body')
      }
      expect((await checkDeck(slideTemplate(item) + `\n::${first}::\n\nDuplicate`)).join()).toContain('duplicate slot')
      expect((await checkDeck(slideTemplate(item) + '\n::unknown::\n\nUnknown')).join()).toContain('unknown slot')
    }
  })
  it('requires layout-specific Markdown structures', async () => {
    const changes = [
      ['agenda', s => s.replace(/\d\. /g, '- '), 'ordered list'],
      ['summary', s => s.replace('来月から小規模試行を始めます。', ''), 'body after H1'],
      ['end', s => s.split('\n')[0], 'body after H1'],
      ['quote', s => s.replace('> ', ''), 'blockquote'],
      ['metrics', s => s.replace('36 時間', '36'), 'value and unit'],
      ['process', s => s.replace('## 対象を決める', '対象を決める'), 'one H2'],
      ['code', s => s.replace(/```js\n[\s\S]*?```/, 'plain source'), 'fenced block'],
    ]
    for (const [id, change, message] of changes) {
      expect((await checkDeck(deck(id, change(added.find(x => x.id === id).markdown)))).join()).toContain(message)
    }
  })
  it('checks agenda boundaries and closing/contact structure without imposing text limits', async () => {
    for (const count of [3, 6]) expect(await checkDeck(deck('agenda', '# Agenda\n\n' + Array.from({ length: count }, (_, i) => `${i + 1}. Item`).join('\n')))).toEqual([])
    for (const count of [2, 7]) expect((await checkDeck(deck('agenda', '# Agenda\n\n' + Array.from({ length: count }, (_, i) => `${i + 1}. Item`).join('\n')))).join()).toContain('3–6')
    expect((await checkDeck(deck('end', '# Closing\n\nClosing only'))).join()).toContain('closing and contact')
    expect(await checkDeck(deck('end', '# Closing\n\nThank you.\n\nteam@example.com'))).toEqual([])
  })
  it('keeps long values and 14 code lines including slot-like code unchanged', async () => {
    const metrics = added.find(x => x.id === 'metrics')
    expect(await checkDeck(slideTemplate(metrics).replace('36 時間', '123,456 時間'))).toEqual([])
    const code = added.find(x => x.id === 'code')
    const lines = ['// ::first::', ...Array.from({ length: 13 }, (_, i) => `const value${i} = ${i}`)].join('\n')
    expect(await checkDeck(slideTemplate(code).replace(/```js\n[\s\S]*?```/, '```js\n' + lines + '\n```'))).toEqual([])
  })
})
