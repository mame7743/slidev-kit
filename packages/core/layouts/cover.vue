<script setup>
import CoverLayout from '../interface/CoverLayout.vue'
import KitSlide from '../components/kit/KitSlide.vue'
import { useKitContext } from '../composables/useKitContext.mjs'
import { isKitPreset } from '../lib/kit-presets.mjs'
const { themeConfig } = useKitContext()
defineProps({ frontmatter: Object, title: String, subtitle: String, author: String, date: String })
</script>
<template>
  <KitSlide v-if="isKitPreset(themeConfig.variant)" kind="cover" :frontmatter="frontmatter"><slot /></KitSlide>
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
