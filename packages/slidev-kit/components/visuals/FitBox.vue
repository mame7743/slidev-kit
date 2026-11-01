<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ align?: 'center' | 'start' }>(), { align: 'center' })
const root = ref<HTMLElement>()
const content = ref<HTMLElement>()
const scale = ref(1)
let observer: ResizeObserver | undefined
let frame = 0

const measure = () => {
  if (!root.value || !content.value) return
  const availableWidth = root.value.clientWidth
  const availableHeight = root.value.clientHeight
  const contentWidth = content.value.scrollWidth
  const contentHeight = content.value.scrollHeight
  if (!availableWidth || !availableHeight || !contentWidth || !contentHeight) return
  scale.value = Math.min(1, availableWidth / contentWidth, availableHeight / contentHeight)
}

const scheduleMeasure = () => {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(measure)
}

onMounted(async () => {
  await nextTick()
  observer = new ResizeObserver(scheduleMeasure)
  if (root.value) observer.observe(root.value)
  if (content.value) observer.observe(content.value)
  window.addEventListener('load', scheduleMeasure)
  document.fonts?.ready.then(scheduleMeasure).catch(() => {})
  scheduleMeasure()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
  window.removeEventListener('load', scheduleMeasure)
})
</script>

<template>
  <div ref="root" class="fit-box" :class="`fit-${props.align}`">
    <div
      ref="content"
      class="fit-box-content"
      :style="{ transform: `scale(${scale})`, transformOrigin: props.align === 'start' ? 'left top' : 'center center' }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.fit-box {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  justify-content: center;
}
.fit-center { align-items: center; }
.fit-start { align-items: flex-start; justify-content: flex-start; }
.fit-box-content { width: 100%; }
</style>
