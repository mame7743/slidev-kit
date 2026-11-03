<script setup>
import KitSlide from '../components/kit/KitSlide.vue'
defineProps({ frontmatter: Object })
</script>
<template>
  <KitSlide kind="quote" :frontmatter="frontmatter">
    <slot />
    <template #quote><slot name="quote" /></template>
    <template #attribution><slot name="attribution" /></template>
  </KitSlide>
</template>
