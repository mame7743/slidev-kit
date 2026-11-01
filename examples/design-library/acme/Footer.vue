<script setup lang="ts">
import type { FooterData } from 'slidev-kit/interface/design.ts'

defineProps<FooterData>()
</script>

<template>
  <footer class="acme-footer">
    <span>{{ department }}</span>
    <span>{{ documentId }} {{ revision }}</span>
    <span>{{ pageNumber }}</span>
  </footer>
</template>

<style scoped>
.acme-footer { display: flex; justify-content: space-between; margin-top: 12px; padding-top: 10px; border-top: 2px solid var(--theme-accent); color: var(--theme-muted); font-size: 14px; }
</style>
