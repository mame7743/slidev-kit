import { computed } from 'vue'
import { configs } from '@slidev/client'
import { resolveDesign } from './registry'

export function useDesign() {
  const variant = computed(() => String(configs.themeConfig.variant || 'default'))
  const design = computed(() => resolveDesign(variant.value))
  return { variant, design }
}
