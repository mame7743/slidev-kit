<script setup>
import { useDesign } from './useDesign'

defineProps({
  title: String,
  subtitle: String,
  author: String,
  date: String,
  image: String,
  imageAlt: String,
  imageFit: String,
  imagePosition: String,
})
const { design } = useDesign()
</script>

<template>
  <component :is="design.Root">
    <component
      :is="design.CoverPage"
      :title="title"
      :subtitle="subtitle"
      :author="author"
      :date="date"
      :image="image"
      :image-alt="imageAlt"
      :image-fit="imageFit"
      :image-position="imagePosition"
    ><slot /></component>
  </component>
</template>
