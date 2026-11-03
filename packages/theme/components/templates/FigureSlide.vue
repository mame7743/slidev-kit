<script setup lang="ts">
import { Comment, computed, useSlots } from 'vue'
import type { PropType } from 'vue'
import DefaultLayout from '../../interface/DefaultLayout.vue'
import FitBox from '../visuals/FitBox.vue'

const props = defineProps({
  title: String,
  takeaway: [String, Boolean],
  section: String,
  chart: String,
  chartType: String as PropType<'bar' | 'line'>,
  chartEmphasis: String,
  chartDashed: String,
  chartUnit: String,
})

const slots = useSlots()

const hasContent = (node: unknown): boolean => {
  if (node === null || node === undefined || typeof node === 'boolean') return false
  if (typeof node === 'string') return node.trim() !== ''
  if (Array.isArray(node)) return node.some(hasContent)
  if (typeof node === 'object' && 'type' in node) {
    const vnode = node as { type: unknown; children?: unknown }
    if (vnode.type === Comment) return false
    if (typeof vnode.children === 'string') return vnode.children.trim() !== ''
    if (Array.isArray(vnode.children)) return vnode.children.some(hasContent)
    return true
  }
  return true
}

const hasFigure = computed(() => hasContent(slots.figure?.()))
const chartKind = computed(() => (props.chartType === 'line' ? 'line' : 'bar'))
</script>

<template>
  <DefaultLayout :title="title" :takeaway="takeaway" :section="section">
    <div class="figure-grid">
      <section class="figure-area">
        <FitBox>
          <slot v-if="hasFigure" name="figure" />
          <Chart
            v-else-if="chart"
            :src="chart"
            :type="chartKind"
            :emphasis="chartEmphasis"
            :dashed="chartDashed"
            :unit="chartUnit"
          />
        </FitBox>
      </section>
      <section><slot /></section>
    </div>
  </DefaultLayout>
</template>

<style scoped>
.figure-grid {
  display: grid;
  grid-template-columns: 1.65fr 1fr;
  gap: 34px;
  height: 100%;
  min-height: 0;
}
.figure-area {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.figure-area :deep(p) { width: 100%; margin: 0; }
.figure-area :deep(img) { display: block; max-width: 100%; height: auto; object-fit: contain; }
</style>
