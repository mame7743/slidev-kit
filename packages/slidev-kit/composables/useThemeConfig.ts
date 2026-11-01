import { computed } from 'vue'
import { configs } from '@slidev/client'

export function useThemeConfig() {
  const organization = computed(() => String(configs.themeConfig.organization || ''))
  const classification = computed(() => String(configs.themeConfig.classification || ''))
  const department = computed(() => String(configs.themeConfig.department || ''))

  return { configs, organization, classification, department }
}
