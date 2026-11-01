<script setup lang="ts">
import type { HeaderData } from 'slidev-kit/interface/design.ts'

defineProps<HeaderData>()
</script>

<template>
  <header class="acme-header">
    <span class="brand">{{ organization || 'ACME' }}</span>
    <span class="section">{{ section }}</span>
    <span class="classification">{{ classification }}</span>
  </header>
  <div v-if="title" class="acme-title"><h1>{{ title }}</h1></div>
</template>

<style scoped>
.acme-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; font-size: 15px; }
.brand { color: var(--theme-accent); font-weight: 800; letter-spacing: .08em; }
.section, .classification { color: var(--theme-muted); }
.acme-title { margin-bottom: 24px; border-left: 6px solid var(--theme-accent); padding-left: 16px; }
.acme-title h1 { margin: 0; font-size: 34px; line-height: 1.25; }
</style>
