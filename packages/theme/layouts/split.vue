<script setup>
import KitSlide from '../components/kit/KitSlide.vue'
defineProps({ frontmatter: Object })
</script>
<template>
  <KitSlide kind="split" :frontmatter="frontmatter">
    <slot />
    <template #left><slot name="left" /></template>
    <template #right><slot name="right" /></template>
  </KitSlide>
</template>
