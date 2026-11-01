<script setup lang="ts">
import type { GeneralPageData } from 'slidev-kit/interface/design.ts'
import PageBody from 'slidev-kit/designs/standard/PageBody.vue'
import Header from './Header.vue'
import Footer from './Footer.vue'

defineProps<{ page: GeneralPageData }>()
</script>

<template>
  <Header v-if="page.chrome.showHeader" v-bind="page.header" />
  <main class="acme-main"><PageBody :takeaway="page.takeaway"><slot /></PageBody></main>
  <Footer v-if="page.chrome.showFooter" v-bind="page.footer" />
</template>

<style scoped>
.acme-main { flex: 1; min-height: 0; display: flex; flex-direction: column; }
</style>
