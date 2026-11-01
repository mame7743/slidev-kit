<script setup>
import DefaultLayout from '../../interface/DefaultLayout.vue'
defineProps({ title: String, takeaway: [String, Boolean], section: String })
</script>

<template>
  <DefaultLayout :title="title" :takeaway="takeaway" :section="section">
    <div class="plan"><slot /></div>
  </DefaultLayout>
</template>

<style scoped>
.plan { height: 100%; display: flex; flex-direction: column; }
.plan :deep(table) { flex: 1 1 auto; height: auto; }
.plan :deep(blockquote) { flex: 0 0 auto; }
.plan :deep(td:first-child) { font-weight: 700; white-space: nowrap; }
</style>
