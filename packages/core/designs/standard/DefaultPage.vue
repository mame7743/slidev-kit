<script setup>
import { useDesign } from '../../interface/useDesign'
import PageHeader from './PageHeader.vue'
import PageBody from './PageBody.vue'
import PageFooter from './PageFooter.vue'

defineProps({ page: { type: Object, required: true } })
const { design } = useDesign()
</script>

<template>
  <component
    :is="design.Header || PageHeader"
    v-if="page.chrome.showHeader"
    v-bind="page.header"
  />
  <component :is="design.Body || PageBody" :takeaway="page.takeaway"><slot /></component>
  <component
    :is="design.Footer || PageFooter"
    v-if="page.chrome.showFooter"
    v-bind="page.footer"
  />
</template>
