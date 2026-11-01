<script setup>
import SummarySlide from '../components/templates/SummarySlide.vue'
defineProps({ frontmatter: Object, title: String, takeaway: [String, Boolean], section: String })
</script>
<template>
  <SummarySlide :title="frontmatter.title" :takeaway="takeaway" :section="section">
    <template #default><slot /></template>
    <template #evidence><slot name="evidence" /></template>
    <template #request><slot name="request" /></template>
  </SummarySlide>
</template>
