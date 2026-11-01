<script setup>
import { computed } from 'vue'
import { configs, useSlideContext } from '@slidev/client'
import { useDesign } from './useDesign'
import StandardPage from '../designs/standard/DefaultPage.vue'

const props = defineProps({ title: String, takeaway: [String, Boolean], section: String })
const { design } = useDesign()
const pageConfig = computed(() => configs.themeConfig.page ?? {})
const themeConfig = computed(() => configs.themeConfig ?? {})
const { $page, $frontmatter } = useSlideContext()
const page = computed(() => ({
  header: {
    title: props.title,
    section: props.section,
    organization: themeConfig.value.organization,
    classification: themeConfig.value.classification,
    options: pageConfig.value.header ?? {},
  },
  footer: {
    department: themeConfig.value.department,
    documentId: themeConfig.value.documentId,
    revision: themeConfig.value.revision,
    pageNumber: $page.value,
    options: pageConfig.value.footer ?? {},
  },
  takeaway: props.takeaway,
  chrome: {
    showHeader: pageConfig.value.header?.enabled !== false && $frontmatter.showHeader !== false,
    showFooter: pageConfig.value.footer?.enabled !== false && $frontmatter.showFooter !== false,
  },
}))
</script>

<template>
  <component :is="design.Root">
    <component :is="design.DefaultPage || StandardPage" :page="page"><slot /></component>
  </component>
</template>
