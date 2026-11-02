<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useKitContext } from '../../composables/useKitContext.mjs'
import '../../designs/corporate/tokens.css'
import '../../designs/corporate/corporate.css'

const props = defineProps<{ kind: string; frontmatter?: Record<string, unknown> }>()
const { frontmatter, page, themeConfig } = useKitContext()
const fm = computed(() => props.frontmatter ?? frontmatter)
const density = computed(() => String(fm.value.density ?? themeConfig.density ?? 'normal'))
const variant = computed(() => String(fm.value.variant ?? (props.kind === 'roadmap' ? 'phases' : 'balanced')))
const root = ref<HTMLElement>()
let observer: ResizeObserver | undefined
let mutations: MutationObserver | undefined
let timer: ReturnType<typeof setTimeout> | undefined
let warned = false
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
  <article ref="root" class="slidev-layout kit-slide" :data-layout="kind" :data-variant="variant" :data-density="density" data-design="corporate">
    <main class="kit-body">
      <div class="kit-region kit-intro"><slot /></div>
      <div v-if="kind === 'split' || kind === 'comparison'" class="kit-columns">
        <section class="kit-region kit-panel"><slot name="left" /></section>
        <section class="kit-region kit-panel"><slot name="right" /></section>
      </div>
      <div v-if="kind === 'cards'" class="kit-cards">
        <section class="kit-region kit-panel"><slot name="first" /></section>
        <section class="kit-region kit-panel"><slot name="second" /></section>
        <section class="kit-region kit-panel"><slot name="third" /></section>
      </div>
    </main>
    <footer class="kit-footer">
      <span>{{ themeConfig.organization || 'Slidev Kit' }}</span>
      <span>{{ page }}</span>
    </footer>
  </article>
</template>
