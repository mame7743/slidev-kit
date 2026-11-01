import type { Design } from './design'
import defaultTheme from '../designs/default'
import mono from '../designs/mono'
import dark from '../designs/dark'

// デザインテンプレート: プロジェクト内 designs/<variant>/index.ts を優先する。
// '/' 始まりのパターンは Vite がプロジェクトルート基準で解決する。
const projectDesigns = import.meta.glob<{ default: Design }>('/designs/*/index.ts', { eager: true })

const builtins: Record<string, Design> = { default: defaultTheme, mono, dark }

export function resolveDesign(variant: string): Design {
  const project = projectDesigns[`/designs/${variant}/index.ts`]
  if (project) return project.default
  return builtins[variant] ?? defaultTheme
}
