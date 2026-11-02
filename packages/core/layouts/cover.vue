<script setup>
import CoverLayout from '../interface/CoverLayout.vue'
import KitSlide from '../components/layouts/KitSlide.vue'
import { configs } from '@slidev/client'
defineProps({ frontmatter: Object, title: String, subtitle: String, author: String, date: String })
</script>
<template>
  <KitSlide v-if="configs.themeConfig.variant === 'corporate'" kind="cover" :frontmatter="frontmatter"><slot /></KitSlide>
  <CoverLayout v-else
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
