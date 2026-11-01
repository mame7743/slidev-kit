<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAutoTextFit } from '../../composables/useAutoTextFit'
import { arrangements, resolveArrangement, resolveColumns, resolveRatio } from '../../lib/layout/arrangement'
const props = defineProps<{ arrangement?: string; ratio?: string; columns?: number; autoFit?: boolean }>()
const root = ref<HTMLElement>()
const { schedule } = useAutoTextFit(root, () => props.autoFit !== false)
watch(() => [props.autoFit, props.columns, props.ratio, props.arrangement], schedule)
const columnCount = computed(() => resolveColumns(props.columns))
const kind = computed(() => columnCount.value === 2 ? 'split' : columnCount.value === 3 ? 'columns' : resolveArrangement(props.arrangement))
const style = computed(() => ({
  gridTemplateColumns: ['split', 'asymmetric', 'main-detail'].includes(kind.value)
    ? resolveRatio(props.ratio, arrangements[kind.value]) : arrangements[kind.value],
}))
</script>

<template>
  <div ref="root" class="content-layout" :data-arrangement="kind" :data-columns="columnCount" :class="{ 'single-row': !$slots.third && !$slots.fourth }" :style="style">
    <section><div class="cell-content"><slot /></div></section>
    <section v-if="$slots.second"><div class="cell-content"><slot name="second" /></div></section>
    <section v-if="$slots.third"><div class="cell-content"><slot name="third" /></div></section>
    <section v-if="$slots.fourth"><div class="cell-content"><slot name="fourth" /></div></section>
  </div>
</template>

<style scoped>
.content-layout { height: 100%; min-height: 0; display: grid; gap: 28px; align-content: stretch; }
.content-layout > section { min-width: 0; min-height: 0; overflow-wrap: anywhere; display: flex; flex-direction: column; }
.cell-content { height: 100%; min-height: 0; min-width: 0; display: flex; flex-direction: column; }
.cell-content > :deep(*) { flex-shrink: 0; }
.content-layout[data-arrangement='center'] { place-items: center; text-align: center; }
.content-layout[data-arrangement='grid'], .content-layout[data-arrangement='dashboard'] { grid-template-rows: repeat(2, minmax(0, 1fr)); }
.content-layout.single-row[data-arrangement='grid'], .content-layout.single-row[data-arrangement='dashboard'] { grid-template-rows: minmax(0, 1fr); }
.content-layout[data-arrangement='top-bottom'] { grid-template-rows: minmax(0, 3fr) minmax(0, 2fr); }
.content-layout[data-arrangement='visual'] .cell-content { display: flex; flex-direction: column; align-items: center; justify-content: center; }
.content-layout[data-arrangement='visual'] :deep(p:has(img)) { min-height: 0; flex: 1; margin: 0; }
.content-layout :deep(p:has(> img)) { flex: 1 1 0; min-height: 0; display: flex; margin-bottom: 8px; }
.content-layout :deep(img) { width: 100%; height: 100%; min-height: 0; object-fit: contain; }
.content-layout[data-arrangement='document'] { column-gap: 40px; }
.content-layout[data-arrangement='freeform'] > section { position: relative; }
.content-layout[data-fit-overflow='true'] { outline: 2px dashed var(--theme-warning-line); outline-offset: 4px; }
.content-layout[data-fit-overflow='true']::after { content: '文字サイズ下限：ページを分割してください'; position: absolute; bottom: 0; right: 0; padding: 3px 8px; background: var(--theme-warning-bg); color: var(--theme-warning-ink); font-size: 14px; line-height: 1.5; }
.content-layout { position: relative; }
</style>
