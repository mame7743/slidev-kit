<script setup>
import KitSlide from '../components/layouts/KitSlide.vue'
defineProps({ frontmatter: Object })
</script>
<template>
  <KitSlide kind="agenda" :frontmatter="frontmatter">
    <slot />
  </KitSlide>
</template>
