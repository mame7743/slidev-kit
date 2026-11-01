<script setup>
import { computed } from 'vue'
import palettes from '../palettes.json'
import { configs, useSlideContext } from '@slidev/client'

const props = defineProps({ variant: { type: String, default: 'default' } })
const { $frontmatter } = useSlideContext()
const density = computed(() => {
  const value = $frontmatter.density ?? configs.themeConfig.density ?? 'hybrid'
  return ['presentation', 'hybrid', 'reading'].includes(value) ? value : 'hybrid'
})
const textSize = computed(() => {
  const value = $frontmatter.textSize ?? configs.themeConfig.textSize
  return ['large', 'medium', 'small'].includes(value) ? value : undefined
})
const palette = computed(() => palettes[props.variant] ?? palettes.default)
const paletteStyle = computed(() =>
  Object.fromEntries(Object.entries(palette.value).map(([key, value]) => [`--theme-${key}`, value])),
)
</script>

<template>
  <div class="slide-page" :data-density="density" :data-text-size="textSize" :style="paletteStyle"><slot /></div>
</template>

<style>
:root {
  --theme-font: 'Yu Gothic', 'Hiragino Kaku Gothic ProN', 'Noto Sans CJK JP', 'Noto Sans JP', Arial, sans-serif;
}

html, body { font-family: var(--theme-font); }
.slidev-layout {
  padding: 0;
  color: var(--theme-ink);
  background: white;
  font-family: var(--theme-font);
  font-size: 26px;
  line-height: 1.65;
}
.slide-page {
  height: 100%;
  width: 100%;
  padding: 28px 64px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  color: var(--theme-ink);
  background: var(--theme-bg);
}
.slide-page main { flex: 1; min-height: 0; }
.slide-page h2 { margin: 0 0 20px; color: var(--theme-accent); font-size: 28px; font-weight: 700; line-height: 1.4; }
.slide-page h3 { font-size: 25px; font-weight: 700; }
.slide-page p { margin: 0 0 18px; }
.slide-page ul, .slide-page ol { margin: 0; padding-left: 1.2em; }
.slide-page li { margin-bottom: 12px; padding-left: 4px; }
.slide-page strong { color: var(--theme-accent); }
.slide-page code { font-size: .82em; }
.slide-page blockquote {
  margin: 0;
  padding-left: 20px;
  border-left: 3px solid var(--theme-line);
  color: var(--theme-muted);
  font-size: 22px;
}
.slide-page table { width: 100%; border-collapse: collapse; font-size: 23px; }
.slide-page th { color: var(--theme-accent); background: var(--theme-soft); font-weight: 700; }
.slide-page th, .slide-page td { padding: 14px 16px; border-bottom: 1px solid var(--theme-line); text-align: left; vertical-align: middle; }
.slide-page main p, .slide-page main li { font-size: 26px; line-height: 1.65; }
.slide-page main ul { list-style: disc; }
.slide-page main ol { list-style: decimal; }
.slide-page main blockquote p { font-size: 20px; }
.slide-page main { min-width: 0; }
.slide-page h1, .slide-page h2, .slide-page h3 { overflow-wrap: anywhere; }
.slide-page main img { max-width: 100%; max-height: 100%; object-fit: contain; }
.slide-page[data-density='presentation'] { padding: 32px 72px; }
.slide-page[data-density='presentation'] main p,
.slide-page[data-density='presentation'] main li { font-size: 32px; line-height: 1.5; }
.slide-page[data-density='presentation'] h2 { font-size: 34px; margin-bottom: 28px; }
.slide-page[data-density='presentation'] li { margin-bottom: 20px; }
.slide-page[data-density='reading'] { padding: 22px 48px; }
.slide-page[data-density='reading'] main p,
.slide-page[data-density='reading'] main li { font-size: 20px; line-height: 1.55; }
.slide-page[data-density='reading'] p { margin-bottom: 10px; }
.slide-page[data-density='reading'] li { margin-bottom: 6px; }
.slide-page[data-density='reading'] h2 { font-size: 24px; margin-bottom: 12px; }
.slide-page[data-density='reading'] h3 { font-size: 22px; }
.slide-page[data-density='reading'] table { font-size: 18px; }
.slide-page[data-density='reading'] th,
.slide-page[data-density='reading'] td { padding: 8px 10px; }
.slide-page[data-density='reading'] header { padding-bottom: 10px; }
.slide-page[data-density='reading'] .page-title-block { margin-bottom: 16px; }
.slide-page[data-density='reading'] .page-title-block h1 { font-size: 32px; padding-bottom: 10px; }
.slide-page[data-density='reading'] footer { margin-top: 8px; padding-top: 8px; }
.slide-page[data-density='reading'] .takeaway { margin-top: 12px; padding: 8px 14px; font-size: 20px; }
.slide-page[data-density='presentation'] .takeaway { margin-top: 28px; font-size: 28px; }
.slide-page[data-density='presentation'] .content-layout { gap: 40px; }
.slide-page[data-density='reading'] .content-layout { gap: 20px; }
/* Text presets override density typography only; page furniture stays fixed. */
.slide-page[data-text-size='large'] { --content-font: 32px; --content-heading: 36px; --content-table: 28px; --content-leading: 1.5; --content-space: 18px; }
.slide-page[data-text-size='medium'] { --content-font: 26px; --content-heading: 30px; --content-table: 23px; --content-leading: 1.6; --content-space: 14px; }
.slide-page[data-text-size='small'] { --content-font: 20px; --content-heading: 24px; --content-table: 18px; --content-leading: 1.55; --content-space: 10px; }
.slide-page[data-text-size] main { font-size: var(--content-font); line-height: var(--content-leading); }
.slide-page[data-text-size] main p,
.slide-page[data-text-size] main li { font-size: var(--content-font); line-height: var(--content-leading); }
.slide-page[data-text-size] main h2 { font-size: var(--content-heading); margin-bottom: var(--content-space); }
.slide-page[data-text-size] main h3 { font-size: var(--content-font); }
.slide-page[data-text-size] main p { margin-bottom: var(--content-space); }
.slide-page[data-text-size] main li { margin-bottom: calc(var(--content-space) / 2); }
.slide-page[data-text-size] main table { font-size: var(--content-table); }
/* Apply font changes only inside content cells, uniformly across a slide. */
.slide-page .content-layout[data-auto-fit] .cell-content { font-size: calc(var(--auto-body) * var(--auto-scale)); }
.slide-page .content-layout[data-auto-fit] p,
.slide-page .content-layout[data-auto-fit] li,
.slide-page .content-layout[data-auto-fit] h3 { font-size: calc(var(--auto-body) * var(--auto-scale)); }
.slide-page .content-layout[data-auto-fit] h2 { font-size: calc(var(--auto-heading) * var(--auto-scale)); }
.slide-page .content-layout[data-auto-fit] table { font-size: calc(var(--auto-table) * var(--auto-scale)); }
</style>
