<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useKitContext } from '../../composables/useKitContext.mjs'
import { isKitPreset, normalizeKitPreset } from '../../lib/kit-presets.mjs'
import '../../designs/shared/tokens.css'
import '../../designs/shared/structure.css'
import '../../designs/editorial/tokens.css'
import '../../designs/editorial/editorial.css'
import '../../designs/corporate/tokens.css'
import '../../designs/corporate/corporate.css'

const props = defineProps<{ kind: string; frontmatter?: Record<string, unknown> }>()
const { frontmatter, page, themeConfig } = useKitContext()
const fm = computed(() => props.frontmatter ?? frontmatter)
const design = computed(() => normalizeKitPreset(themeConfig.variant))
const density = computed(() => String(fm.value.density ?? themeConfig.density ?? 'normal'))
const variant = computed(() => String(fm.value.variant ?? (props.kind === 'roadmap' ? 'phases' : 'balanced')))
const root = ref<HTMLElement>()
let observer: ResizeObserver | undefined
let mutations: MutationObserver | undefined
let timer: ReturnType<typeof setTimeout> | undefined
let warned = false
// kit preset は本文Markdownだけを描画するため、旧frontmatter方式の指定は黙って消える。
const legacyKeys = ['title', 'subtitle', 'note', 'takeaway'].filter(key => (props.frontmatter ?? frontmatter)[key] !== undefined)
if (isKitPreset(themeConfig.variant) && legacyKeys.length) {
  console.warn(`[slidev-kit] slide ${page.value}: frontmatter ${legacyKeys.join('/')} is ignored in the kit preset; write it as an H1 or body text in the slide.`)
}
function checkOverflow() {
  const el = root.value
  if (!el) return
  const bounds = el.getBoundingClientRect()
  const elements = [...el.querySelectorAll<HTMLElement>('.kit-region, .kit-region *')]
  for (let i = 0; i < elements.length; i++) {
    const shadow = elements[i].shadowRoot
    if (shadow) elements.push(...shadow.querySelectorAll<HTMLElement>('*'))
  }
  const overflow = elements.some((child) => {
    const rect = child.getBoundingClientRect()
    if (!rect.width && !rect.height) return false
    return rect.right > bounds.right + 2 || rect.bottom > bounds.bottom + 2
      || rect.left < bounds.left - 2 || rect.top < bounds.top - 2
      || (child instanceof HTMLElement && child.scrollWidth > child.clientWidth + 2)
  })
  el.dataset.overflow = String(overflow)
  if (overflow && !warned) console.warn(`[slidev-kit] slide ${page.value}: content overflows; reduce content or use density: compact.`)
  warned = overflow
}
onMounted(async () => {
  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(checkOverflow, 150)
  }
  observer = new ResizeObserver(schedule)
  mutations = new MutationObserver(schedule)
  if (root.value) {
    observer.observe(root.value)
    mutations.observe(root.value, { childList: true, characterData: true, subtree: true })
    root.value.querySelectorAll('.kit-region, .mermaid').forEach(region => observer?.observe(region))
  }
  await document.fonts.ready
  if (root.value) {
    observer?.observe(root.value.querySelector('.kit-body')!)
    root.value.querySelectorAll('img').forEach(img => img.addEventListener('load', checkOverflow, { once: true }))
  }
  checkOverflow()
})
onBeforeUnmount(() => { observer?.disconnect(); mutations?.disconnect(); clearTimeout(timer) })
</script>

<template>
  <article ref="root" class="slidev-layout kit-slide" :data-layout="kind" :data-variant="variant" :data-density="density" :data-design="design">
    <main class="kit-body">
      <div class="kit-region kit-intro"><slot /></div>
      <div v-if="kind === 'split' || kind === 'comparison'" class="kit-columns">
        <section class="kit-region kit-panel"><slot name="left" /></section>
        <section class="kit-region kit-panel"><slot name="right" /></section>
      </div>
      <div v-if="['cards', 'metrics', 'process'].includes(kind)" :class="`kit-${kind}`">
        <section class="kit-region kit-panel"><slot name="first" /></section>
        <section class="kit-region kit-panel"><slot name="second" /></section>
        <section class="kit-region kit-panel"><slot name="third" /></section>
      </div>
      <div v-if="kind === 'summary'" class="kit-summary">
        <section class="kit-region kit-panel"><slot name="evidence" /></section>
        <section class="kit-region kit-panel"><slot name="request" /></section>
      </div>
      <div v-if="kind === 'quote'" class="kit-quote">
        <section class="kit-region kit-panel"><slot name="quote" /></section>
        <section class="kit-region kit-panel"><slot name="attribution" /></section>
      </div>
      <div v-if="kind === 'code'" class="kit-code">
        <section class="kit-region kit-panel"><slot name="code" /></section>
        <section class="kit-region kit-panel"><slot name="explanation" /></section>
      </div>
    </main>
    <footer class="kit-footer">
      <span>{{ themeConfig.organization || 'Slidev Kit' }}</span>
      <span>{{ page }}</span>
    </footer>
  </article>
</template>
