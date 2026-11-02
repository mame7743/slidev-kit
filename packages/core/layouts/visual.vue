<script setup>
import KitSlide from '../components/layouts/KitSlide.vue'
defineProps({ frontmatter: Object })
</script>
<template><KitSlide kind="visual" :frontmatter="frontmatter"><slot /></KitSlide></template>
