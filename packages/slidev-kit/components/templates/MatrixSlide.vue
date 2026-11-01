<script setup>
import DefaultLayout from '../../interface/DefaultLayout.vue'
defineProps({ title: String, takeaway: [String, Boolean], section: String })
</script>

<template>
  <DefaultLayout :title="title" :takeaway="takeaway" :section="section">
    <div class="matrix"><slot /></div>
  </DefaultLayout>
</template>

<style scoped>
.matrix { height: 100%; display: flex; flex-direction: column; }
.matrix :deep(table) {
  flex: 1 1 auto;
  height: auto;
  table-layout: fixed;
}
.matrix :deep(blockquote) { flex: 0 0 auto; }
.matrix :deep(table) th,
.matrix :deep(table) td { text-align: center; }
.matrix :deep(table) th:first-child { width: 30%; }
</style>
