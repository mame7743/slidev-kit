<script setup>
import { useDesign } from './useDesign'

defineProps({ title: String, subtitle: String, note: String })
const { design } = useDesign()
</script>

<template>
  <component :is="design.Root">
    <component :is="design.EndPage" :title="title" :subtitle="subtitle" :note="note"><slot /></component>
  </component>
</template>
