<script setup>
import PageFooter from './PageFooter.vue'

defineProps({ title: String, subtitle: String, note: String })
</script>

<template>
  <main class="end-main">
    <div class="end-content">
      <span class="end-rule"></span>
      <h1 class="end-title">{{ title || 'End' }}</h1>
      <p v-if="subtitle" class="end-subtitle">{{ subtitle }}</p>
      <p v-if="note" class="end-note">{{ note }}</p>
      <slot />
    </div>
  </main>
  <PageFooter />
</template>

<style scoped>
.end-main { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
.end-content { display: flex; flex-direction: column; align-items: center; text-align: center; }
.end-rule { width: 76px; height: 7px; margin-bottom: 30px; background: var(--theme-accent); }
.end-title { margin: 0; color: var(--theme-ink); font-size: 54px; font-weight: 700; line-height: 1.3; }
.end-content .end-subtitle { margin: 18px 0 0; color: var(--theme-muted); font-size: 24px; }
.end-content .end-note { margin: 10px 0 0; color: var(--theme-muted); font-size: 18px; }
</style>
