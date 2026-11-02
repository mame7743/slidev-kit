<!-- registry・catalog対象外（Slidev再帰走査で到達可能・テスト対象） -->
<script setup>
import PlanSlide from '../../components/templates/PlanSlide.vue'
defineProps({ frontmatter: Object, title: String, takeaway: [String, Boolean], section: String })
</script>
<template><PlanSlide :title="frontmatter.title" :takeaway="takeaway" :section="section"><slot /></PlanSlide></template>
