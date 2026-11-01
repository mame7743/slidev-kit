<script setup>
import BodySlide from '../components/templates/BodySlide.vue'
defineProps({ frontmatter: Object, title: String, takeaway: [String, Boolean], section: String })
</script>
<template><BodySlide :title="frontmatter.title" :takeaway="takeaway" :section="section"><slot /></BodySlide></template>
