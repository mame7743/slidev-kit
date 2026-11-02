<script setup>
import ComparisonSlide from '../components/templates/ComparisonSlide.vue'
import KitSlide from '../components/layouts/KitSlide.vue'
import { configs } from '@slidev/client'
defineProps({ frontmatter: Object, title: String, takeaway: [String, Boolean], section: String })
</script>
<template>
  <KitSlide v-if="configs.themeConfig.variant === 'corporate'" kind="comparison" :frontmatter="frontmatter">
    <slot />
    <template #left><slot name="left" /></template>
    <template #right><slot name="right" /></template>
  </KitSlide>
  <ComparisonSlide v-else :title="frontmatter.title" :takeaway="takeaway" :section="section">
    <template #left><slot name="left" /></template>
    <template #right><slot name="right" /></template>
  </ComparisonSlide>
</template>
