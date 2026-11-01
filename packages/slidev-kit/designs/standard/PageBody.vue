<script setup>
import { useSlideContext } from '@slidev/client'
defineProps({ takeaway: [String, Boolean] })
const { $frontmatter } = useSlideContext()
</script>

<template>
  <main><slot /></main>
  <aside v-if="takeaway && $frontmatter.takeaway !== false" class="takeaway">{{ takeaway }}</aside>
  <aside v-if="$frontmatter.notes || $frontmatter.source" class="page-notes">
    <div v-if="$frontmatter.notes">{{ $frontmatter.notes }}</div>
    <div v-if="$frontmatter.source">出典: {{ $frontmatter.source }}</div>
  </aside>
</template>

<style scoped>
.takeaway {
  flex-shrink: 0;
  margin-top: 20px;
  padding: 12px 20px;
  border-left: 5px solid var(--theme-accent);
  background: var(--theme-soft);
  font-size: 24px;
  font-weight: 600;
}
.page-notes { flex-shrink: 0; margin-top: 10px; color: var(--theme-muted); font-size: 15px; line-height: 1.5; }
</style>
