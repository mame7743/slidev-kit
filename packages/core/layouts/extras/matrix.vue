<!-- registry・catalog対象外（Slidev再帰走査で到達可能・テスト対象） -->
<script setup>
import MatrixSlide from '../../components/templates/MatrixSlide.vue'
defineProps({ frontmatter: Object, title: String, takeaway: [String, Boolean], section: String })
</script>
<template><MatrixSlide :title="frontmatter.title" :takeaway="takeaway" :section="section"><slot /></MatrixSlide></template>
