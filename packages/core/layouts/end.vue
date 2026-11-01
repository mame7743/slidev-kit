<script setup>
import EndLayout from '../interface/EndLayout.vue'
defineProps({ frontmatter: Object })
</script>
<template><EndLayout :title="frontmatter.title" :subtitle="frontmatter.subtitle" :note="frontmatter.note"><slot /></EndLayout></template>
