<script setup>
import ComparisonSlide from '../components/templates/ComparisonSlide.vue'
defineProps({ frontmatter: Object, title: String, takeaway: [String, Boolean], section: String })
</script>
<template>
  <ComparisonSlide :title="frontmatter.title" :takeaway="takeaway" :section="section">
    <template #left><slot name="left" /></template>
    <template #right><slot name="right" /></template>
  </ComparisonSlide>
</template>
