import { defineConfig } from 'vite'
import { slidevCharts } from './src/vite/plugin.mjs'

export default defineConfig({
  plugins: [slidevCharts()],
})
