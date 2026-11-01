import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { deckInfo, getSlide, insertSlide, listReference, moveSlide, readDeck, removeSlide, splitDeck, updateSlide, writeProjectFile } from '../src/deck.mjs'
import { createSlideTools } from '../src/tools.mjs'

const dirs = []
const workspace = () => {
  const dir = mkdtempSync(join(tmpdir(), 'slidev-agent-'))
  dirs.push(dir)
  return dir
}
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

const deck = `---
theme: slidev-template
layout: cover
title: Test deck
---

# Hello

---
layout: body
title: Second
---

Body

<!-- note -->
`

describe('slide deck tools', () => {
  it('parses frontmatter, content and speaker notes', () => {
    const slides = splitDeck(deck)
    expect(slides).toHaveLength(2)
    expect(slides[0].frontmatter.title).toBe('Test deck')
    expect(slides[1].note).toBe('note')
    expect(slides[1].content).toContain('Body')
  })

  it('updates, inserts, moves and removes slides', () => {
    const root = workspace()
    writeFileSync(join(root, 'slides.md'), deck)
    updateSlide(root, 'slides.md', 2, { content: 'Updated', frontmatter: { title: 'Changed' } })
    expect(getSlide(root, 'slides.md', 2).content).toBe('Updated')
    expect(getSlide(root, 'slides.md', 2).frontmatter.title).toBe('Changed')
    insertSlide(root, 'slides.md', 1, { content: 'Inserted', frontmatter: { layout: 'body', title: 'Inserted' } })
    expect(deckInfo(root, 'slides.md').totalSlides).toBe(3)
    moveSlide(root, 'slides.md', 2, { before: 1 })
    expect(getSlide(root, 'slides.md', 1).content).toBe('Inserted')
    removeSlide(root, 'slides.md', 1)
    expect(deckInfo(root, 'slides.md').totalSlides).toBe(2)
    expect(readDeck(root, 'slides.md').slides[1].note).toBe('note')
  })

  it('rejects paths outside the project', () => {
    const root = workspace()
    expect(() => writeProjectFile(root, '../outside.md', 'x')).toThrow(/プロジェクト外/)
  })

  it('lists reference files from ref/ with the contracted extensions', () => {
    const root = workspace()
    writeFileSync(join(root, 'slides.md'), deck)
    mkdirSync(join(root, 'ref', 'nested'), { recursive: true })
    writeFileSync(join(root, 'ref', 'brief.md'), 'a')
    writeFileSync(join(root, 'ref', '議事録.pdf'), 'b')
    writeFileSync(join(root, 'ref', '提案.pptx'), 'c')
    writeFileSync(join(root, 'ref', 'data.csv'), 'd')
    writeFileSync(join(root, 'ref', 'skip.log'), 'e')
    writeFileSync(join(root, 'ref', 'nested', 'guide.txt'), 'f')
    const expected = ['ref/brief.md', 'ref/data.csv', 'ref/nested/guide.txt', 'ref/提案.pptx', 'ref/議事録.pdf']
    expect(listReference(root)).toEqual(expected)
    expect(deckInfo(root, 'slides.md').reference).toEqual(expected)
  })

  it('returns an empty reference list when ref/ does not exist', () => {
    const root = workspace()
    writeFileSync(join(root, 'slides.md'), deck)
    expect(deckInfo(root, 'slides.md').reference).toEqual([])
  })

  it('exposes slide-specific tools without a shell tool', () => {
    const tools = createSlideTools(process.cwd(), 'slides.md')
    const names = tools.map(tool => tool.name)
    expect(names).toContain('update_slide')
    expect(names).toContain('validate_deck')
    expect(names).toContain('export_pdf')
    expect(names).not.toContain('bash')
  })
})
