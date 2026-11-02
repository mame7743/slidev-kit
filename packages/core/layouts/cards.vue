<script setup>
import KitSlide from '../components/layouts/KitSlide.vue'
defineProps({ frontmatter: Object })
</script>
<template>
  <KitSlide kind="cards" :frontmatter="frontmatter">
    <slot />
    <template #first><slot name="first" /></template>
    <template #second><slot name="second" /></template>
    <template #third><slot name="third" /></template>
  </KitSlide>
</template>
