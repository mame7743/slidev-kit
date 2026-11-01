<script setup>
import DefaultLayout from '../../interface/DefaultLayout.vue'
defineProps({ title: String, takeaway: [String, Boolean], section: String })
</script>

<template>
  <DefaultLayout :title="title" :takeaway="takeaway" :section="section">
    <div class="summary-lead"><slot /></div>
    <div class="two-col">
      <section><slot name="evidence" /></section>
      <section><slot name="request" /></section>
    </div>
  </DefaultLayout>
</template>

<style scoped>
.summary-lead {
  margin-bottom: 32px;
  color: var(--theme-accent);
  font-size: 32px;
  font-weight: 700;
}
.slide-page .summary-lead :deep(p) { font-size: 32px; }
.summary-lead + .two-col { height: auto; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; height: 100%; }
.two-col > section + section {
  padding-left: 30px;
  border-left: 1px solid var(--theme-line);
}
</style>
