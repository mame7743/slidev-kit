<script setup>
import KitSlide from '../components/kit/KitSlide.vue'
import { useKitContext } from '../composables/useKitContext.mjs'
import { isKitPreset } from '../lib/kit-presets.mjs'
const { themeConfig } = useKitContext()
import SummarySlide from '../components/templates/SummarySlide.vue'
defineProps({ frontmatter: Object, title: String, takeaway: [String, Boolean], section: String })
</script>
<template>
  <KitSlide v-if="isKitPreset(themeConfig.variant)" kind="summary" :frontmatter="frontmatter">
    <slot />
    <template #evidence><slot name="evidence" /></template>
    <template #request><slot name="request" /></template>
  </KitSlide>
  <SummarySlide v-else :title="frontmatter.title" :takeaway="takeaway" :section="section">
    <template #default><slot /></template>
    <template #evidence><slot name="evidence" /></template>
    <template #request><slot name="request" /></template>
  </SummarySlide>
</template>
