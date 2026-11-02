<script setup>
import ComparisonSlide from '../components/templates/ComparisonSlide.vue'
import KitSlide from '../components/layouts/KitSlide.vue'
import { useKitContext } from '../composables/useKitContext.mjs'
import { isKitPreset } from '../lib/kit-presets.mjs'
const { themeConfig } = useKitContext()
defineProps({ frontmatter: Object, title: String, takeaway: [String, Boolean], section: String })
</script>
<template>
  <KitSlide v-if="isKitPreset(themeConfig.variant)" kind="comparison" :frontmatter="frontmatter">
    <slot />
    <template #left><slot name="left" /></template>
    <template #right><slot name="right" /></template>
  </KitSlide>
  <ComparisonSlide v-else :title="frontmatter.title" :takeaway="takeaway" :section="section">
    <template #left><slot name="left" /></template>
    <template #right><slot name="right" /></template>
  </ComparisonSlide>
</template>
