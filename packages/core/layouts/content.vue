<script setup>
import DefaultLayout from '../interface/DefaultLayout.vue'
import KitSlide from '../components/layouts/KitSlide.vue'
import { useKitContext } from '../composables/useKitContext.mjs'
import { isKitPreset } from '../lib/kit-presets.mjs'
const { themeConfig } = useKitContext()
import ContentLayout from '../components/layouts/ContentLayout.vue'
defineProps({ frontmatter: { type: Object, required: true } })
</script>
<template>
  <KitSlide v-if="isKitPreset(themeConfig.variant)" kind="content" :frontmatter="frontmatter"><slot /></KitSlide>
  <DefaultLayout v-else :title="frontmatter.title" :section="frontmatter.section" :takeaway="typeof frontmatter.takeaway === 'string' ? frontmatter.takeaway : undefined">
    <ContentLayout :auto-fit="frontmatter.autoFit" :columns="frontmatter.columns" :arrangement="frontmatter.arrangement" :ratio="frontmatter.ratio">
      <slot />
      <template v-if="$slots.second" #second><slot name="second" /></template>
      <template v-if="$slots.third" #third><slot name="third" /></template>
      <template v-if="$slots.fourth" #fourth><slot name="fourth" /></template>
    </ContentLayout>
  </DefaultLayout>
</template>
