import type { Ref } from 'vue'

export function getKitThemeConfig(): Record<string, unknown>

export function useKitContext(): {
  frontmatter: Record<string, unknown>
  page: Ref<number>
  themeConfig: Record<string, unknown>
}
