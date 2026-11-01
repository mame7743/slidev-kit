import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { slidevCharts } from 'slidev-charts'
import { templateCharts } from './scripts/vite-plugin-charts.mjs'

// slidev-kit はテーマ兼アドオン。Slidev がこの vite.config を自動で読み込む。
export default defineConfig({
  resolve: {
    alias: {
      // interface/registry.ts がプロジェクト内のデザインテンプレートを解決する。
      '@slidev-kit-designs': resolve(process.cwd(), 'designs'),
    },
  },
  plugins: [templateCharts(), slidevCharts()],
})
