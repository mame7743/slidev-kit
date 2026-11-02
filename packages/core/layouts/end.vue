<script setup>
import KitSlide from '../components/layouts/KitSlide.vue'
import { useKitContext } from '../composables/useKitContext.mjs'
import { isKitPreset } from '../lib/kit-presets.mjs'
const { themeConfig } = useKitContext()
import EndLayout from '../interface/EndLayout.vue'
defineProps({ frontmatter: Object })
</script>
<template>
  <KitSlide v-if="isKitPreset(themeConfig.variant)" kind="end" :frontmatter="frontmatter"><slot /></KitSlide>
  <EndLayout v-else :title="frontmatter.title" :subtitle="frontmatter.subtitle" :note="frontmatter.note"><slot /></EndLayout>
</template>
