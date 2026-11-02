import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Resolve the parsers from the Slidev peer, not repository-only devDependencies.
// Verified with Slidev 53.0.0. Missing/incompatible APIs must fail closed.
const require = createRequire(import.meta.url)
let parse, resolveConfig, Markdown
try {
  const slidevRequire = createRequire(require.resolve('@slidev/cli/package.json'))
  ;({ parse, resolveConfig } = await import(pathToFileURL(slidevRequire.resolve('@slidev/parser')).href))
  ;({ default: Markdown } = await import(pathToFileURL(slidevRequire.resolve('markdown-exit')).href))
  if (typeof parse !== 'function' || typeof resolveConfig !== 'function' || typeof Markdown !== 'function') throw new Error('incompatible parser API')
} catch (error) {
  throw new Error(`slidev-kit checker requires the @slidev/cli parser APIs (tested with 53.0.0): ${error.message}`)
}
const markdown = new Markdown()
// Match Slidev 53's MarkdownItSlotSugar block rule. Keep marker tokens for
// validation instead of compiling them to <template v-slot:...> HTML.
const RE_SLOT_MARKER = /^::\s*([\w.\-:]+)\s*::\s*$/
markdown.block.ruler.before('fence', 'slot_marker', (state, startLine, _endLine, silent) => {
  if (state.sCount[startLine] - state.blkIndent > 0) return false
  const pos = state.bMarks[startLine] + state.tShift[startLine]
  const match = state.src.slice(pos, state.eMarks[startLine]).match(RE_SLOT_MARKER)
  if (!match) return false
  if (silent) return true
  const token = state.push('slot_marker', '', 0)
  token.meta = { slotName: match[1] }
  token.map = [startLine, startLine + 1]
  state.line = startLine + 1
  return true
}, { alt: ['paragraph', 'reference', 'blockquote', 'list'] })
const localRegistry = new URL('../registry/layouts.json', import.meta.url)
const registryPath = existsSync(localRegistry) ? localRegistry
  : join(dirname(require.resolve('slidev-core/package.json')), 'registry/layouts.json')
export const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
export const parseDeck = parse

// Same theme-name/path conventions as Slidev's resolver, without installing missing themes.
export function resolveDeckConfig(deck, filename) {
  const head = deck.slides[0]?.frontmatter ?? {}
  const theme = head.theme
  let themeRoot
  if (theme && theme !== 'none') {
    if (isAbsolute(theme)) themeRoot = theme
    else if (theme.startsWith('@/')) themeRoot = resolve(dirname(filename), theme.slice(2))
    else if (theme.startsWith('.') || (!theme.startsWith('@') && theme.includes('/'))) themeRoot = resolve(dirname(filename), theme)
    else {
      const fromDeck = createRequire(resolve(dirname(filename), 'package.json'))
      const names = theme.includes('/') || theme.startsWith('@') ? [theme] : [`@slidev/theme-${theme}`, `slidev-theme-${theme}`, theme]
      for (const name of names) {
        try { themeRoot = dirname(fromDeck.resolve(`${name}/package.json`)); break } catch {}
      }
      if (!themeRoot) throw new Error(`Cannot resolve theme package: ${theme}`)
    }
  }
  const manifest = themeRoot && join(themeRoot, 'package.json')
  const meta = manifest && existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')).slidev : {}
  return resolveConfig(head, meta, filename)
}

export function slideTokens(slide) { return markdown.parse(slide.content, {}) }
const slotName = token => token.type === 'slot_marker' ? token.meta.slotName : undefined
export function checkKitSlides(deck, filename, themeConfig = deck.slides[0]?.frontmatter.themeConfig ?? {}) {
  const errors = []
  for (const [index, slide] of deck.slides.entries()) {
    const fm = slide.frontmatter
    const prefix = `${filename}: slide ${index + 1}`
    const layout = registry.find(item => item.id === fm.layout)
    if (!layout) { errors.push(`${prefix}: unknown layout: ${fm.layout}`); continue }
    if (fm.variant !== undefined && !layout.variants.includes(fm.variant)) errors.push(`${prefix}: unsupported variant: ${fm.variant}`)
    const density = fm.density ?? themeConfig.density ?? 'normal'
    if (!layout.density.includes(density)) errors.push(`${prefix}: unsupported density: ${density}`)
    const tokens = slideTokens(slide)
    const slots = tokens.map(slotName).filter(Boolean)
    for (const slot of new Set(slots)) {
      if (!layout.slots.some(s => s.name === slot)) errors.push(`${prefix}: unknown slot: ${slot}`)
      if (slots.filter(s => s === slot).length > 1) errors.push(`${prefix}: duplicate slot: ${slot}`)
    }
    for (const slot of layout.slots.filter(s => s.required)) {
      if (!slots.includes(slot.name)) errors.push(`${prefix}: missing required slot: ${slot.name}`)
      else {
        const marker = tokens.findIndex(t => slotName(t) === slot.name)
        const following = tokens.slice(marker + 1).find(t => ['slot_marker', 'inline', 'fence', 'code_block', 'html_block'].includes(t.type))
        if (!following || slotName(following)) errors.push(`${prefix}: empty required slot: ${slot.name}`)
      }
    }
    if (!tokens.some(t => t.type === 'heading_open' && t.tag === 'h1' && t.level === 0)) errors.push(`${prefix}: Markdown H1 title is required`)
  }
  return errors
}

export async function checkDeck(source, filename = 'slides.md') {
  try {
    const deck = await parse(source, filename)
    return checkKitSlides(deck, filename, resolveConfig(deck.slides[0]?.frontmatter ?? {}).themeConfig)
  } catch (error) { return [`${filename}: ${error.message}`] }
}

export function markdownImages(tokens) {
  return tokens.flatMap(token => [
    ...(token.type === 'image' ? [token.attrGet('src')] : []),
    ...markdownImages(token.children ?? []),
  ])
}
