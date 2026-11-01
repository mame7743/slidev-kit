<script setup>
import { useDesign } from './useDesign'
import StandardEndPage from '../designs/standard/EndPage.vue'

const props = defineProps({ title: String, subtitle: String, note: String })
const { design } = useDesign()
const page = { title: props.title, subtitle: props.subtitle, note: props.note }
</script>

<template>
  <component :is="design.Root">
    <component :is="design.EndPage || StandardEndPage" :page="page"><slot /></component>
  </component>
</template>
