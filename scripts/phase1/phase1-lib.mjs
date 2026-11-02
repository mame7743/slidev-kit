import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'
import { registry, checkDeck } from '../../packages/core/lib/deck-contract.mjs'
export { registry, checkDeck }

export const root = fileURLToPath(new URL('../../', import.meta.url))
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
