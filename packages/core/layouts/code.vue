<script setup>
import KitSlide from '../components/layouts/KitSlide.vue'
defineProps({ frontmatter: Object })
</script>
<template>
  <KitSlide kind="code" :frontmatter="frontmatter">
    <slot />
    <template #code><slot name="code" /></template>
    <template #explanation><slot name="explanation" /></template>
  </KitSlide>
</template>
