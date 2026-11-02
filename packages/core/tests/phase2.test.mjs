import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { createRequire } from 'node:module'
import { parse, compileScript } from '@vue/compiler-sfc'
import ts from 'typescript'
import { createSSRApp, h, ref, reactive, nextTick } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { kitPresets, isKitPreset, normalizeKitPreset } from '../lib/kit-presets.mjs'
import { registry, root, sampleDeck, checkDeck } from '../../../scripts/phase1/phase1-lib.mjs'

const require = createRequire(import.meta.url)
const themeConfig = reactive({ variant: 'corporate' })
const context = { useKitContext: () => ({ frontmatter: {}, page: ref(1), themeConfig }) }
// Compile and execute the actual SFC render functions, not a duplicated template.
function loadComponent(file) {
  const source = readFileSync(file, 'utf8')
  const { descriptor } = parse(source)
  const script = compileScript(descriptor, { id: file, inlineTemplate: true })
  const code = ts.transpileModule(script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} }
  const localRequire = id => {
    if (id.endsWith('.css')) return {}
    if (id.endsWith('useKitContext.mjs')) return context
    if (id.endsWith('kit-presets.mjs')) return { isKitPreset, normalizeKitPreset }
    if (id.endsWith('KitSlide.vue')) return loadComponent(resolve(dirname(file), id))
    if (id.endsWith('.vue')) return { render: () => h('div', { 'data-legacy': id }) }
    return require(id)
  }
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports)
  return module.exports.default
}
const KitSlide = loadComponent(join(root, 'packages/core/components/layouts/KitSlide.vue'))
const render = (component, props, slots) => renderToString(createSSRApp({ render: () => h(component, props, slots) }))

describe('Phase2 preset contract', () => {
  it('recognizes only explicit presets and preserves Corporate fallback', () => {
    expect(kitPresets).toEqual(['corporate', 'editorial'])
    for (const value of [undefined, null, '', 'default', 'mono', 'dark', 'custom', 'Editorial', {}]) {
      expect(isKitPreset(value)).toBe(false)
      expect(normalizeKitPreset(value)).toBe('corporate')
    }
    for (const value of kitPresets) expect(normalizeKitPreset(value)).toBe(value)
  })
  it('renders the same ten layouts and slots for both reactive theme presets', async () => {
    for (const preset of kitPresets) {
      themeConfig.variant = preset
      await nextTick()
      for (const layout of registry) {
        const slots = { default: () => h('h1', 'Same title') }
        for (const slot of layout.slots) slots[slot.name] = () => `same-${slot.name}`
        const html = await render(KitSlide, { kind: layout.id, frontmatter: { variant: layout.variants[0], density: 'normal' } }, slots)
        expect(html).toContain(`data-design="${preset}"`)
        expect(html).toContain(`data-layout="${layout.id}"`)
        expect(html).toContain(`data-variant="${layout.variants[0]}"`)
        expect(html).toContain('Same title')
        for (const slot of layout.slots) expect(html).toContain(`same-${slot.name}`)
      }
    }
  })
  it('keeps legacy branches for the three overlapping IDs and Corporate fallback for other IDs', async () => {
    for (const id of ['cover', 'content', 'comparison']) {
      const component = loadComponent(join(root, `packages/core/layouts/${id}.vue`))
      for (const preset of [...kitPresets, 'default', 'mono', 'dark', 'custom']) {
        themeConfig.variant = preset
        const html = await render(component, { frontmatter: { title: 'Legacy' } }, { default: () => 'Body' })
        expect(html.includes('data-legacy')).toBe(!isKitPreset(preset))
        expect(html.includes('kit-slide')).toBe(isKitPreset(preset))
      }
    }
    themeConfig.variant = 'custom'
    for (const layout of registry.filter(l => !['cover', 'content', 'comparison'].includes(l.id))) {
      const html = await render(loadComponent(join(root, `packages/core/layouts/${layout.id}.vue`)), { frontmatter: {} })
      expect(html).toContain('data-design="corporate"')
    }
  })
  it('defines an identical semantic token contract and shares all geometry', () => {
    const tokens = preset => readFileSync(join(root, `packages/core/designs/${preset}/tokens.css`), 'utf8')
    const names = source => [...source.matchAll(/(--kit-[\w-]+):/g)].map(m => m[1]).sort()
    expect(names(tokens('editorial'))).toEqual(names(tokens('corporate')))
    for (const preset of kitPresets) {
      expect(tokens(preset)).toContain(`[data-design='${preset}']`)
      expect(tokens(preset)).not.toContain('--kit-padding:')
    }
  })
  it('generates identical content from the registry without changing Phase1', async () => {
    const source = readFileSync(join(root, 'examples/phase2/slides.md'), 'utf8')
    expect(source.replace('variant: editorial', 'variant: corporate')).toBe(sampleDeck())
    expect(await checkDeck(source)).toEqual([])
  })
})
