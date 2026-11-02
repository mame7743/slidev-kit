import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'
import MarkdownIt from 'markdown-it'
import { parse } from '@slidev/parser'

export const root = fileURLToPath(new URL('../../', import.meta.url))
export const registry = JSON.parse(readFileSync(new URL('../../packages/core/registry/layouts.json', import.meta.url), 'utf8'))
const schema = JSON.parse(readFileSync(new URL('../../packages/core/registry/layouts.schema.json', import.meta.url), 'utf8'))
const validate = new Ajv({ allErrors: true }).compile(schema)
export function validateRegistry(value) {
  if (!validate(value)) throw new Error(JSON.stringify(validate.errors))
  if (new Set(value.map(x => x.id)).size !== value.length) throw new Error('Duplicate layout ID')
  for (const layout of value) {
    if (new Set(layout.slots.map(x => x.name)).size !== layout.slots.length) throw new Error(`Duplicate slot: ${layout.id}`)
    if (layout.template !== `catalog/templates/${layout.id}.md` || layout.preview !== `catalog/previews/${layout.id}.png`)
      throw new Error(`Inconsistent paths: ${layout.id}`)
  }
  return value
}
validateRegistry(registry)

export const headmatter = 'theme: ../../\nthemeConfig:\n  variant: corporate\n  organization: Slidev Kit\naspectRatio: 16/9\ncanvasWidth: 1280\ncolorSchema: light\nfonts:\n  sans: Arial\n  local: Arial\n';
export function slideTemplate(layout, head = '') {
  return `---\n${head}layout: ${layout.id}\nvariant: ${layout.variants[0]}\ndensity: normal\n---\n\n${layout.markdown}\n`
}
export function sampleDeck() {
  return registry.map((layout, i) => slideTemplate(layout, i === 0 ? headmatter : '')).join('\n')
}

const markdown = new MarkdownIt()
/** Use Slidev's parser for deck boundaries/YAML and Markdown-it for slot paragraphs. */
export async function checkDeck(source, filename = 'slides.md') {
  const errors = []
  let deck
  try { deck = await parse(source, filename) }
  catch (error) { return [`${filename}: ${error.message}`] }
  for (const [index, slide] of deck.slides.entries()) {
    const fm = slide.frontmatter
    const prefix = `${filename}: slide ${index + 1}`
    const layout = registry.find(item => item.id === fm.layout)
    if (!layout) { errors.push(`${prefix}: unknown layout: ${fm.layout}`); continue }
    if (fm.variant !== undefined && !layout.variants.includes(fm.variant)) errors.push(`${prefix}: unsupported variant: ${fm.variant}`)
    const density = fm.density ?? deck.slides[0]?.frontmatter.themeConfig?.density ?? 'normal'
    if (!layout.density.includes(density)) errors.push(`${prefix}: unsupported density: ${density}`)
    const tokens = markdown.parse(slide.content, {})
    const slots = tokens.filter(t => t.type === 'inline' && /^::[a-zA-Z0-9_-]+::$/.test(t.content.trim()))
      .map(t => t.content.trim().slice(2, -2))
    for (const slot of slots) {
      if (!layout.slots.some(s => s.name === slot)) errors.push(`${prefix}: unknown slot: ${slot}`)
      if (slots.filter(s => s === slot).length > 1) errors.push(`${prefix}: duplicate slot: ${slot}`)
    }
    for (const slot of layout.slots.filter(s => s.required)) {
      if (!slots.includes(slot.name)) errors.push(`${prefix}: missing required slot: ${slot.name}`)
      else {
        const marker = tokens.findIndex(t => t.type === 'inline' && t.content.trim() === `::${slot.name}::`)
        const following = tokens.slice(marker + 1).find(t => ['inline', 'fence', 'code_block', 'html_block'].includes(t.type))
        if (!following || /^::[a-zA-Z0-9_-]+::$/.test(following.content.trim())) errors.push(`${prefix}: empty required slot: ${slot.name}`)
      }
    }
    if (!tokens.some(t => t.type === 'heading_open' && t.tag === 'h1')) errors.push(`${prefix}: Markdown H1 title is required`)
  }
  return errors
}
