<script setup>
import DefaultLayout from '../../interface/DefaultLayout.vue'
defineProps({ title: String, takeaway: [String, Boolean], section: String })
</script>

<template>
  <DefaultLayout :title="title" :takeaway="takeaway" :section="section"><slot /></DefaultLayout>
</template>
