import type { Design } from './design'
import defaultTheme from '../designs/default'
import mono from '../designs/mono'
import dark from '../designs/dark'

// デザインテンプレート: プロジェクト内 designs/<variant>/index.ts を優先する。
// エイリアス @slidev-kit-designs は vite.config.ts がプロジェクト直下の designs/ を指す。
const projectDesigns = import.meta.glob<{ default: Design }>('@slidev-kit-designs/*/index.ts', { eager: true })

const builtins: Record<string, Design> = { default: defaultTheme, mono, dark }

export function resolveDesign(variant: string): Design {
  const project = projectDesigns[`@slidev-kit-designs/${variant}/index.ts`]
  if (project) return project.default
  return builtins[variant] ?? defaultTheme
}
