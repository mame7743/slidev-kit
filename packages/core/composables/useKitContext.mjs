import { configs, useSlideContext } from '@slidev/client'

// Isolate Slidev's Vite-only client entry from library typechecking.
// Its source entry depends on injected virtual modules and build globals.
export function getKitThemeConfig() {
  return configs.themeConfig
}

export function useKitContext() {
  const { $frontmatter, $page } = useSlideContext()
  return { frontmatter: $frontmatter, page: $page, themeConfig: configs.themeConfig }
}
