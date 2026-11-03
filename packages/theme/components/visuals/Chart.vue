<script setup lang="ts">
import ChartImpl from 'slidev-charts/components/Chart.vue'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <ChartImpl v-bind="$attrs" />
</template>
