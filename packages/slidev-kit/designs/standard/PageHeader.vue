<script setup>
import { useThemeConfig } from 'slidev-kit/composables/useThemeConfig'

defineProps({ title: String, section: String })
const { organization, classification } = useThemeConfig()
</script>

<template>
  <header>
    <span v-if="section || organization">{{ section || organization }}</span>
    <span v-if="classification">{{ classification }}</span>
  </header>
  <div v-if="title" class="page-title-block"><h1>{{ title }}</h1></div>
</template>

<style scoped>
header {
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  padding-bottom: 20px;
  color: var(--theme-muted);
  font-size: 16px;
}
.page-title-block { flex-shrink: 0; margin: 0 0 28px; }
.page-title-block h1 {
  margin: 0;
  padding-bottom: 18px;
  border-bottom: 3px solid var(--theme-accent);
  font-size: 38px;
  font-weight: 700;
  line-height: 1.35;
}
</style>
