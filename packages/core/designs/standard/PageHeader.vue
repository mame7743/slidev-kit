<script setup>
const props = defineProps({
  title: String,
  section: String,
  organization: String,
  classification: String,
  options: { type: Object, default: () => ({}) },
})
</script>

<template>
  <header>
    <span v-if="props.options.section !== false && (section || (props.options.organization !== false && props.organization))">{{ section || (props.options.organization !== false ? props.organization : '') }}</span>
    <span v-if="props.options.classification !== false && props.classification">{{ props.classification }}</span>
  </header>
  <div v-if="title && props.options.title !== false" class="page-title-block"><h1>{{ title }}</h1></div>
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
