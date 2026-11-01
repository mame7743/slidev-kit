<script setup>
import StandardRoot from 'slidev-kit/designs/default/PageRoot.vue'
</script>

<template><StandardRoot class="theme-acme"><slot /></StandardRoot></template>

<style>
.slide-page.theme-acme {
  --theme-accent: #a83a53 !important;
  --theme-soft: #f8e9ed !important;
  --theme-line: #dfc5cc !important;
  --theme-muted: #6f5960 !important;
  --theme-ink: #2d2024 !important;
  --theme-bg: #fffdfd !important;
}
.slide-page.theme-acme header { letter-spacing: .04em; }
.slide-page.theme-acme footer { border-top-width: 2px; }
</style>
