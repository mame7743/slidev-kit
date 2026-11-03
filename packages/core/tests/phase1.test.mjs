import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { checkDeck, registry, root, slideTemplate, sampleDeck, phase1Registry, headmatter, validateRegistry } from '../../../scripts/phase1/phase1-lib.mjs'

const valid = (id, body, extra = '') => `---\nlayout: ${id}\n${extra}---\n\n${body}\n`

describe('Phase 1 public registry', () => {
  it('pins the original ten fixture IDs and validates the public registry', () => {
    expect(phase1Registry.map(l => l.id)).toEqual(['cover', 'section', 'content', 'split', 'comparison', 'cards', 'visual', 'chart', 'table', 'roadmap'])
    expect(validateRegistry(registry)).toBe(registry)
    for (const layout of registry) expect(existsSync(join(root, `packages/theme/layouts/${layout.id}.vue`))).toBe(true)
  })
  it('rejects invalid schemas, duplicate IDs, duplicate slots, and inconsistent paths', () => {
    expect(() => validateRegistry([{ id: 'invalid' }])).toThrow()
    expect(() => validateRegistry([...registry, registry[0]])).toThrow('Duplicate layout ID')
    const split = registry.find(l => l.id === 'split')
    expect(() => validateRegistry([{ ...split, slots: [...split.slots, split.slots[0]] }])).toThrow('Duplicate slot')
    expect(() => validateRegistry([{ ...registry[0], preview: 'catalog/previews/other.png' }])).toThrow('Inconsistent paths')
    expect(() => validateRegistry([{ ...registry[0], variants: ['unsupported'] }])).toThrow()
  })
  it('has generated copy-paste templates with no HTML/Vue required', async () => {
    for (const layout of registry) {
      const template = readFileSync(join(root, layout.template), 'utf8')
      expect(template).toBe(slideTemplate(layout))
      expect(template).not.toMatch(/<[A-Za-z][^>]*>/)
      expect(await checkDeck(template)).toEqual([])
      for (const variant of layout.variants)
        for (const density of layout.density)
          expect(await checkDeck(template.replace(`variant: ${layout.variants[0]}`, `variant: ${variant}`).replace('density: normal', `density: ${density}`))).toEqual([])
    }
    expect(readFileSync(join(root, 'examples/core-layouts/slides.md'), 'utf8')).toBe(sampleDeck())
    expect(await checkDeck(sampleDeck())).toEqual([])
  })
})

describe('Phase 1 deck validation uses standard Markdown parsing', () => {
  it('rejects unknown layout, unsupported variant/density, missing H1', async () => {
    expect((await checkDeck(valid('missing', '# Title')))[0]).toContain('unknown layout')
    expect((await checkDeck(valid('table', '# Title', 'variant: left\n')))[0]).toContain('unsupported variant')
    expect((await checkDeck(valid('table', '# Title', 'density: tiny\n')))[0]).toContain('unsupported density')
    expect((await checkDeck(valid('table', 'Text only')))[0]).toContain('H1')
    expect((await checkDeck(valid('table', '# Title', `${headmatter}themeConfig:\n  density: tiny\n`)))[0]).toBeTruthy()
  })
  it('rejects missing, unknown, duplicate, and empty slots', async () => {
    expect((await checkDeck(valid('split', '# Title'))).join()).toContain('missing required slot: left')
    expect((await checkDeck(valid('split', '# Title\n\n::left::\n\n::right::'))).join()).toContain('empty required slot: left')
    expect((await checkDeck(valid('table', '# Title\n\n::wrong::\n\nContent'))).join()).toContain('unknown slot')
    expect((await checkDeck(valid('split', '# Title\n\n::left::\n\nA\n\n::left::\n\nB\n\n::right::\n\nC'))).join()).toContain('duplicate slot')
  })
  it('does not interpret slot-like text inside fenced code as actual slots', async () => {
    expect(await checkDeck(valid('content', '# Code\n\n```md\n::left::\n---\n```'))).toEqual([])
    expect((await checkDeck(valid('split', '# Code\n\n```md\n::left::\n::right::\n```'))).join()).toContain('missing required slot')
  })
  it('returns YAML errors and honors global density', async () => {
    expect((await checkDeck('---\nlayout: [\n---\n# Bad')).length).toBeGreaterThan(0)
    expect(await checkDeck(valid('content', '# Good', 'themeConfig:\n  density: compact\n'))).toEqual([])
  })
})
