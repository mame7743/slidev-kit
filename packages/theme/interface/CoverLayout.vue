<script setup>
import { useDesign } from './useDesign'
import StandardCoverPage from '../designs/standard/CoverPage.vue'

const props = defineProps({
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
const page = {
  title: props.title, subtitle: props.subtitle, author: props.author, date: props.date,
  image: props.image, imageAlt: props.imageAlt, imageFit: props.imageFit, imagePosition: props.imagePosition,
}
</script>

<template>
  <component :is="design.Root">
    <component :is="design.CoverPage || StandardCoverPage" :page="page"><slot /></component>
  </component>
</template>
