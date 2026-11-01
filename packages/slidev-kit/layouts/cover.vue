<script setup>
import CoverLayout from '../interface/CoverLayout.vue'
defineProps({ frontmatter: Object, title: String, subtitle: String, author: String, date: String })
</script>
<template>
  <CoverLayout
    :title="frontmatter.title"
    :subtitle="subtitle"
    :author="frontmatter.author"
    :date="date"
    :image="frontmatter.coverImage"
    :image-alt="frontmatter.coverImageAlt"
    :image-fit="frontmatter.coverImageFit"
    :image-position="frontmatter.coverImagePosition"
  ><slot /></CoverLayout>
</template>
