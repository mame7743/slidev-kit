<script setup>
import KitSlide from '../components/layouts/KitSlide.vue'
defineProps({ frontmatter: Object })
</script>
<template><KitSlide kind="roadmap" :frontmatter="frontmatter"><slot /></KitSlide></template>
