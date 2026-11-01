<script setup>
const props = defineProps({
  department: String,
  documentId: String,
  revision: String,
  pageNumber: [String, Number],
  options: { type: Object, default: () => ({}) },
})
</script>

<template>
  <footer>
    <span v-if="props.options.department !== false && props.department">{{ props.department }}</span>
    <span v-if="props.options.documentId !== false && (props.documentId || props.revision)">{{ props.documentId }} {{ props.revision }}</span>
    <span v-if="props.options.pageNumber !== false">{{ props.pageNumber }}</span>
  </footer>
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
