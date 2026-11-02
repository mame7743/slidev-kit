<!-- registry・catalog対象外（Slidev再帰走査で到達可能・テスト対象） -->
<script setup>
import ColumnsSlide from '../../components/templates/ColumnsSlide.vue'
defineProps({ frontmatter: Object, title: String, takeaway: [String, Boolean], section: String })
</script>
<template>
  <ColumnsSlide :title="frontmatter.title" :takeaway="takeaway" :section="section">
    <template #first><slot name="first" /></template>
    <template #second><slot name="second" /></template>
    <template #third><slot name="third" /></template>
  </ColumnsSlide>
</template>
