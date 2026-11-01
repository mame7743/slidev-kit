<script setup>
import PageHeader from './PageHeader.vue'
import PageBody from './PageBody.vue'
import PageFooter from './PageFooter.vue'

defineProps({ title: String, takeaway: [String, Boolean], section: String })
</script>

<template>
  <PageHeader :title="title" :section="section" />
  <PageBody :takeaway="takeaway"><slot /></PageBody>
  <PageFooter />
</template>
