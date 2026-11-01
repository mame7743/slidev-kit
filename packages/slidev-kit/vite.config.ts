import { defineConfig } from 'vite'
import { slidevCharts } from 'slidev-charts'
import { templateCharts } from './scripts/vite-plugin-charts.mjs'

// slidev-kit はテーマ兼アドオン。Slidev がこの vite.config を自動で読み込む。
export default defineConfig({
  plugins: [templateCharts(), slidevCharts()],
})
