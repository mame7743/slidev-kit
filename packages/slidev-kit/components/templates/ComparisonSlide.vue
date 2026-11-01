<script setup>
import DefaultLayout from '../../interface/DefaultLayout.vue'
defineProps({ title: String, takeaway: [String, Boolean], section: String })
</script>

<template>
  <DefaultLayout :title="title" :takeaway="takeaway" :section="section">
    <div class="two-col">
      <section><slot name="left" /></section>
      <section><slot name="right" /></section>
    </div>
  </DefaultLayout>
</template>

<style scoped>
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; height: 100%; }
.two-col > section + section {
  padding-left: 30px;
  border-left: 1px solid var(--theme-line);
}
</style>
