<script setup>
import PlanSlide from '../components/templates/PlanSlide.vue'
defineProps({ frontmatter: Object, title: String, takeaway: [String, Boolean], section: String })
</script>
<template><PlanSlide :title="frontmatter.title" :takeaway="takeaway" :section="section"><slot /></PlanSlide></template>
