<script setup>
import FigureSlide from '../components/templates/FigureSlide.vue'
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
