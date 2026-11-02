<script setup>
import KitSlide from '../components/kit/KitSlide.vue'
defineProps({ frontmatter: Object })
</script>
<template><KitSlide kind="chart" :frontmatter="frontmatter"><slot /></KitSlide></template>
