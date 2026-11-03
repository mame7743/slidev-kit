<!-- registry・catalog対象外（Slidev再帰走査で到達可能・テスト対象） -->
<script setup>
import FigureSlide from '../../components/templates/FigureSlide.vue'
defineProps({ frontmatter: Object, title: String, takeaway: [String, Boolean], section: String })
</script>
<template>
  <FigureSlide
    :title="frontmatter.title"
    :takeaway="takeaway"
    :section="section"
    :chart="frontmatter.chart"
    :chart-type="frontmatter.chartType"
    :chart-emphasis="frontmatter.chartEmphasis"
    :chart-dashed="frontmatter.chartDashed"
    :chart-unit="frontmatter.chartUnit"
  >
    <template #default><slot /></template>
    <template #figure><slot name="figure" /></template>
  </FigureSlide>
</template>
