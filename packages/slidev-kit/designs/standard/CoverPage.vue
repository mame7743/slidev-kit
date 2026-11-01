<script setup>
import PageHeader from './PageHeader.vue'
import PageFooter from './PageFooter.vue'
import CoverImage from '../../components/visuals/CoverImage.vue'

defineProps({
  title: String,
  subtitle: String,
  author: String,
  date: String,
  image: String,
  imageAlt: String,
  imageFit: String,
  imagePosition: String,
})
</script>

<template>
  <PageHeader />
  <main class="cover-main" :class="{ 'has-image': image }">
    <div class="cover-content">
      <div class="cover-rule"></div>
      <h1>{{ title }}</h1>
      <p class="cover-subtitle">{{ subtitle }}</p>
      <div class="cover-meta"><p>{{ author }}</p><p>{{ date }}</p></div>
      <slot />
    </div>
    <CoverImage
      v-if="image"
      class="cover-image"
      :src="image"
      :alt="imageAlt || title"
      :fit="imageFit || 'cover'"
      :position="imagePosition || 'center'"
    />
  </main>
  <PageFooter />
</template>

<style scoped>
.cover-content { padding-top: 75px; max-width: 1040px; }
.cover-content h1 { margin: 0 0 24px; font-size: 58px; font-weight: 700; line-height: 1.35; }
.cover-subtitle { color: var(--theme-muted); font-size: 29px; }
.cover-meta { margin-top: 48px; font-size: 22px; }
.cover-meta p { margin-bottom: 8px; font-size: 22px; }
.cover-content p { font-size: 29px; }
.cover-rule { width: 76px; height: 7px; margin-bottom: 30px; background: var(--theme-accent); }
.cover-main.has-image {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 44px;
  min-height: 0;
}
.cover-main.has-image .cover-content { align-self: center; max-width: none; padding-top: 0; }
.cover-image { min-height: 0; }
</style>
