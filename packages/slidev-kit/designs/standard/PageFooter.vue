<script setup>
import { configs, useSlideContext } from '@slidev/client'
import { useThemeConfig } from '../../composables/useThemeConfig'

const { $page } = useSlideContext()
const { department } = useThemeConfig()
</script>

<template>
  <footer><span v-if="department">{{ department }}</span><span v-if="configs.themeConfig.documentId || configs.themeConfig.revision">{{ configs.themeConfig.documentId }} {{ configs.themeConfig.revision }}</span><span>{{ $page }}</span></footer>
</template>

<style scoped>
footer {
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 16px;
  border-top: 1px solid var(--theme-line);
  color: var(--theme-muted);
  font-size: 16px;
}
</style>
