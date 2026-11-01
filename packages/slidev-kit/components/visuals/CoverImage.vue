<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  src: string
  alt?: string
  fit?: 'cover' | 'contain'
  position?: string
}>(), {
  alt: '',
  fit: 'cover',
  position: 'center',
})

const resolvedSrc = computed(() => {
  if (/^(https?:|data:|blob:)/.test(props.src)) return props.src
  if (props.src.startsWith('/')) return `${import.meta.env.BASE_URL}${props.src.slice(1)}`
  return props.src
})
</script>

<template>
  <figure class="cover-image">
    <img :src="resolvedSrc" :alt="alt" :style="{ objectFit: fit, objectPosition: position }">
  </figure>
</template>

<style scoped>
.cover-image {
  width: 100%;
  height: 100%;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  background: var(--theme-soft);
}
.cover-image img { display: block; width: 100%; height: 100%; }
</style>
