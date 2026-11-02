<!-- registry・catalog対象外（Slidev再帰走査で到達可能・テスト対象） -->
<script setup>
import BodySlide from '../../components/templates/BodySlide.vue'
defineProps({ frontmatter: Object, title: String, takeaway: [String, Boolean], section: String })
</script>
<template><BodySlide :title="frontmatter.title" :takeaway="takeaway" :section="section"><slot /></BodySlide></template>
