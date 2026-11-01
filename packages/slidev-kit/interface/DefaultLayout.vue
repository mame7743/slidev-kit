<script setup>
import { useDesign } from './useDesign'

defineProps({ title: String, takeaway: [String, Boolean], section: String })
const { design } = useDesign()
</script>

<template>
  <component :is="design.Root">
    <component :is="design.DefaultPage" :title="title" :takeaway="takeaway" :section="section"><slot /></component>
  </component>
</template>
