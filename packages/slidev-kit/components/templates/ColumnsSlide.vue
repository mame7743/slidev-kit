<script setup>
import DefaultLayout from '../../interface/DefaultLayout.vue'
defineProps({ title: String, takeaway: [String, Boolean], section: String })
</script>

<template>
  <DefaultLayout :title="title" :takeaway="takeaway" :section="section">
    <div class="three-col">
      <section><slot name="first" /></section>
      <section><slot name="second" /></section>
      <section><slot name="third" /></section>
    </div>
  </DefaultLayout>
</template>

<style scoped>
.three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; height: 100%; }
.three-col > section + section {
  padding-left: 30px;
  border-left: 1px solid var(--theme-line);
}
</style>
