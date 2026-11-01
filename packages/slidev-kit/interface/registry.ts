import type { Design } from './design'
import defaultTheme from '../designs/default'
import mono from '../designs/mono'
import dark from '../designs/dark'
import projectDesigns from 'virtual:slidev-kit-designs'

// デザインテンプレート: プロジェクト内 designs/<variant>/index.ts を優先する。
// virtual:slidev-kit-designs は vite.config.ts がプロジェクト直下の designs/ から生成する。
const builtins: Record<string, Design> = { default: defaultTheme, mono, dark }

export function resolveDesign(variant: string): Design {
  return (projectDesigns as Record<string, Design>)[variant] ?? builtins[variant] ?? defaultTheme
}
