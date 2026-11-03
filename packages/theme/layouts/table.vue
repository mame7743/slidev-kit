<script setup>
import KitSlide from '../components/kit/KitSlide.vue'
defineProps({ frontmatter: Object })
</script>
<template><KitSlide kind="table" :frontmatter="frontmatter"><slot /></KitSlide></template>
