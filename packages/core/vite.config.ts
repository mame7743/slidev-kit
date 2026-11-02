import { existsSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { templateCharts } from './scripts/vite-plugin-charts.mjs'

// slidev-charts の場所: npm同梱 / gitツリー / 開発リポジトリのいずれか。
const packageRoot = dirname(fileURLToPath(import.meta.url))
function chartsRoot() {
  const candidates = [
    resolve(process.cwd(), 'node_modules', 'slidev-kit', 'node_modules', 'slidev-charts'),
    join(packageRoot, 'node_modules', 'slidev-charts'),
    resolve(packageRoot, '..', 'charts'),
  ]
  const found = candidates.find((path) => existsSync(path))
  if (!found) throw new Error('slidev-charts が見つかりません。')
  return found
}

// プロジェクト内 designs/<variant>/index.ts を解決する仮想モジュール。
function projectDesigns() {
  return {
    name: 'slidev-kit-designs',
    resolveId(id) {
      if (id === 'virtual:slidev-kit-designs') return '\0virtual:slidev-kit-designs'
    },
    load(id) {
      if (id !== '\0virtual:slidev-kit-designs') return
      const dir = resolve(process.cwd(), 'designs')
      const variants = existsSync(dir)
        ? readdirSync(dir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory() && entry.name !== 'standard' && existsSync(join(dir, entry.name, 'index.ts')))
            .map((entry) => entry.name)
        : []
      const imports = variants
        .map((variant, index) => `import * as d${index} from ${JSON.stringify(resolve(dir, variant, 'index.ts'))}`)
        .join('\n')
      return `${imports}\nexport default { ${variants.map((variant, index) => `${JSON.stringify(variant)}: d${index}.default`).join(', ')} }`
    },
  }
}

export default defineConfig(async () => {
  const { slidevCharts } = await import(join(chartsRoot(), 'src', 'vite', 'plugin.mjs'))
  return {
    resolve: {
      alias: {
        // Also resolve self-references when this repository is used as a local theme.
        // packages/core has its own package boundary, so Node self-resolution cannot find the root package.
        'slidev-kit': packageRoot,
        // Vue compiles Markdown images into imports; theme public assets are not in userRoot/public.
        '/slidev-kit': join(packageRoot, 'public', 'slidev-kit'),
        // SFCからの import 'slidev-charts/...' を同梱位置へ向ける。
        'slidev-charts': chartsRoot(),
      },
    },
    plugins: [projectDesigns(), templateCharts(), slidevCharts()],
  }
})
