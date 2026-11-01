<script setup lang="ts">
import { computed, ref, useAttrs, watchEffect } from 'vue'
import { figureHashFromConfig, knownProps, normalizeFigureProps } from '../src/shared/figure.mjs'
import { useCsvChart } from '../src/csv/client/useCsvChart'

const props = defineProps<{
  preset?: string
  src: string
  type?: 'bar' | 'line'
  chart?: string
  title?: string
  width?: string | number
  height?: string | number
  aspect?: string | number
  fit?: 'contain' | 'cover' | 'fill'
  theme?: string
  x?: string
  y?: string
  group?: string
  sort?: string
  xMin?: number | string
  xMax?: number | string
  yMin?: number | string
  yMax?: number | string
  xLabel?: string
  yLabel?: string
  legend?: string
  legendAlign?: 'left' | 'right'
  grid?: string
  axes?: Record<string, unknown>
  series?: string | Record<string, unknown>
  annotations?: unknown[]
  layout?: Record<string, unknown>
  options?: Record<string, unknown>
  custom?: string
  label?: string
  emphasis?: string
  dashed?: string
  reference?: string
  encoding?: 'auto' | 'utf-8' | 'shift_jis'
  skipRows?: number | string
  maxPoints?: number | string
  horizontal?: boolean | string
  categoryLabels?: boolean | string
  valueLabels?: boolean | string
  tickLabels?: boolean | string
  min?: number | string
  max?: number | string
  tickInterval?: number | string
  tickCount?: number | string
  unit?: string
}>()

const attrs = useAttrs()
const failed = ref(false)
const attempt = ref(0)
const error = ref('')
const isCsv = computed(() => props.type !== undefined)
const {
  W, H, source, loading, loadError, result, model, horizontal, legendVisible, legend, legendAlign,
  layout, plotW, plotH, axisMin, axisRange, yScale, xScale, rowBand, rowCenter, xAt, labelStride,
  hBarHeight, hBarY, vBarWidth, vBarX, vBarHeight, points, seriesClasses, formatValue, tooltip,
  referenceAnchor, referenceLabelX, referenceLabelY, showCategoryLabels, showValueLabels, showTickLabels,
} = useCsvChart(props as Record<string, any>, isCsv)
const presetProps = computed(() => Object.fromEntries(
  Object.entries(props).filter(([key, value]) => value !== undefined && knownProps.has(key)),
))
const normalized = computed(() => {
  if (isCsv.value) return { config: {}, unknown: [] }
  try {
    error.value = ''
    return normalizeFigureProps(presetProps.value)
  } catch (caught) {
    error.value = (caught as Error).message
    return { config: {}, unknown: [] }
  }
})
const config = computed(() => normalized.value.config as Record<string, unknown>)
const hash = computed(() => Object.keys(config.value).length ? figureHashFromConfig(config.value) : '')
const buildId = typeof __FIG_BUILD_ID__ === 'undefined' ? 'dev' : __FIG_BUILD_ID__
const src = computed(() => hash.value ? `/charts/${hash.value}.svg?v=${buildId}${attempt.value ? `&retry=${attempt.value}` : ''}` : '')
const alt = computed(() => String(config.value.title || config.value.preset || '図表'))
const wrapperStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width || '100%',
  height: typeof props.height === 'number' ? `${props.height}px` : props.height || '100%',
}))
const imageStyle = computed(() => ({ width: '100%', height: '100%', objectFit: props.fit || 'contain' }))
const figureStyle = computed(() => props.aspect ? { aspectRatio: String(props.aspect).replace(':', ' / ') } : undefined)
const retry = () => {
  if (attempt.value < 20) setTimeout(() => { attempt.value += 1 }, 500)
  else failed.value = true
}
watchEffect(() => {
  for (const key of Object.keys(attrs)) console.warn(`[Chart] 未知のPropを無視しました: ${key}`)
})
</script>

<template>
  <div class="slidev-chart" :style="wrapperStyle">
    <template v-if="isCsv">
      <div class="csv-chart">

      <div v-if="loadError" class="csv-chart-error">{{ loadError }}</div>
      <div v-else-if="loading" class="csv-chart-state">CSVを読み込み中…</div>
      <div v-else-if="result.error" class="csv-chart-error">CSVグラフのエラー: {{ result.error }}</div>
      <template v-else-if="model">
        <div v-if="props.title || (legendVisible && legend === 'top')" class="csv-chart-head">
          <div v-if="props.title" class="csv-chart-title">{{ props.title }}</div>
          <div
            v-if="legendVisible && legend === 'top'"
            class="csv-chart-legend"
            :class="`legend-${legendAlign}`"
          >
            <span
              v-for="(item, index) in model.series"
              :key="item.name"
              class="csv-chart-legend-item"
              :class="seriesClasses(item.name, index)"
            >
              <i class="csv-chart-swatch" />{{ item.name }}
            </span>
          </div>
        </div>

        <svg
          class="csv-chart-svg"
          :viewBox="`0 0 ${W} ${H}`"
          role="img"
          :aria-label="props.title || `CSVグラフ: ${props.src}`"
        >
          <title>{{ props.title || `CSVグラフ: ${props.src}` }}</title>

          <g class="csv-chart-grid">
            <template v-if="horizontal">
              <line
                v-for="tick in model.ticks"
                :key="`grid-${tick}`"
                :x1="xScale(tick)"
                :x2="xScale(tick)"
                :y1="layout.top"
                :y2="layout.top + plotH"
              />
            </template>
            <template v-else>
              <line
                v-for="tick in model.ticks"
                :key="`grid-${tick}`"
                :x1="layout.left"
                :x2="layout.left + plotW"
                :y1="yScale(tick)"
                :y2="yScale(tick)"
              />
            </template>
          </g>

          <g class="csv-chart-axis">
            <line
              :x1="layout.left"
              :x2="horizontal ? layout.left + plotW : layout.left"
              :y1="horizontal ? layout.top + plotH : layout.top"
              :y2="layout.top + plotH"
            />
            <template v-if="horizontal">
              <template v-if="showTickLabels">
                <text
                  v-for="tick in model.ticks"
                  :key="`tick-${tick}`"
                  class="csv-chart-tick"
                  :x="xScale(tick)"
                  :y="layout.top + plotH + 28"
                  text-anchor="middle"
                >
                  {{ formatValue(tick) }}
                </text>
              </template>
              <text
                v-if="unit"
                class="csv-chart-axis-title"
                :x="layout.left + plotW / 2"
                :y="H - 8"
                text-anchor="middle"
              >
                {{ unit }}
              </text>
            </template>
            <template v-else>
              <template v-if="showTickLabels">
                <text
                  v-for="tick in model.ticks"
                  :key="`tick-${tick}`"
                  class="csv-chart-tick"
                  :x="layout.left - 14"
                  :y="yScale(tick)"
                  text-anchor="end"
                  dominant-baseline="middle"
                >
                  {{ formatValue(tick) }}
                </text>
              </template>
              <text
                v-if="unit"
                class="csv-chart-axis-title"
                :x="18"
                :y="layout.top + plotH / 2"
                text-anchor="middle"
                :transform="`rotate(-90 18 ${layout.top + plotH / 2})`"
              >
                {{ unit }}
              </text>
            </template>
          </g>

          <g v-if="horizontal">
            <g v-for="(label, row) in model.labels" :key="`row-${row}`">
              <text
                v-if="showCategoryLabels"
                class="csv-chart-category"
                :x="layout.left - 16"
                :y="rowCenter(row)"
                text-anchor="end"
                dominant-baseline="middle"
              >
                {{ label }}
              </text>
              <rect
                v-for="(item, index) in model.series"
                :key="item.name"
                class="csv-chart-bar"
                :class="seriesClasses(item.name, index, label)"
                :x="layout.left"
                :y="hBarY(row, index)"
                :width="Math.max(0.75, xScale(item.values[row]) - xScale(axisMin))"
                :height="hBarHeight"
                rx="2"
              >
                <title>{{ tooltip(item.name, label, item.values[row]) }}</title>
              </rect>
              <text
                v-if="showValueLabels && model.series.length === 1"
                class="csv-chart-value"
                :x="xScale(model.series[0].values[row]) + 10"
                :y="rowCenter(row)"
                dominant-baseline="middle"
              >
                {{ formatValue(model.series[0].values[row]) }}
              </text>
            </g>
          </g>

          <g v-else-if="model.type === 'bar'">
            <g v-for="(label, row) in model.labels" :key="`row-${row}`">
              <rect
                v-for="(item, index) in model.series"
                :key="item.name"
                class="csv-chart-bar"
                :class="seriesClasses(item.name, index, label)"
                :x="vBarX(row, index)"
                :y="yScale(item.values[row])"
                :width="vBarWidth"
                :height="vBarHeight(item.values[row])"
                rx="2"
              >
                <title>{{ tooltip(item.name, label, item.values[row]) }}</title>
              </rect>
              <text
                v-if="showValueLabels && model.series.length === 1 && yScale(model.series[0].values[row]) > layout.top + 22"
                class="csv-chart-value"
                :x="vBarX(row, 0) + vBarWidth / 2"
                :y="yScale(model.series[0].values[row]) - 9"
                text-anchor="middle"
              >
                {{ formatValue(model.series[0].values[row]) }}
              </text>
              <text
                v-if="showCategoryLabels && (row % labelStride === 0 || row === model.labels.length - 1)"
                class="csv-chart-category"
                :x="xAt(row)"
                :y="layout.top + plotH + 32"
                text-anchor="middle"
              >
                {{ label }}
              </text>
            </g>
          </g>

          <g v-else>
            <g
              v-for="(item, index) in model.series"
              :key="item.name"
              :class="seriesClasses(item.name, index)"
            >
              <polyline
                v-if="item.values.length > 1"
                class="csv-chart-line"
                :points="points(item.values)"
                fill="none"
              />
              <circle
                v-for="(value, pointIndex) in item.values"
                :key="pointIndex"
                class="csv-chart-point"
                :cx="xAt(pointIndex)"
                :cy="yScale(value)"
                r="5.5"
              >
                <title>{{ tooltip(item.name, model.labels[pointIndex], value) }}</title>
              </circle>
            </g>
            <g v-if="showCategoryLabels">
              <template v-for="(label, row) in model.labels" :key="`label-${row}`">
                <text
                  v-if="row % labelStride === 0 || row === model.labels.length - 1"
                  class="csv-chart-category"
                  :x="xAt(row)"
                  :y="layout.top + plotH + 32"
                  text-anchor="middle"
                >
                  {{ label }}
                </text>
              </template>
            </g>
          </g>

          <g v-if="model.references.length" class="csv-chart-references">
            <template v-if="horizontal">
              <g v-for="reference in model.references" :key="`ref-${reference.value}-${reference.label}`">
                <line
                  :x1="xScale(reference.value)"
                  :x2="xScale(reference.value)"
                  :y1="layout.top"
                  :y2="layout.top + plotH"
                  class="csv-chart-reference"
                />
                <text
                  v-if="reference.label"
                  class="csv-chart-reference-label"
                  :x="referenceLabelX(reference.value)"
                  :y="layout.top + 16"
                  :text-anchor="referenceAnchor(reference.value)"
                >
                  {{ reference.label }}
                </text>
              </g>
            </template>
            <template v-else>
              <g v-for="reference in model.references" :key="`ref-${reference.value}-${reference.label}`">
                <line
                  :x1="layout.left"
                  :x2="layout.left + plotW"
                  :y1="yScale(reference.value)"
                  :y2="yScale(reference.value)"
                  class="csv-chart-reference"
                />
                <text
                  v-if="reference.label"
                  class="csv-chart-reference-label"
                  :x="layout.left + plotW - 4"
                  :y="referenceLabelY(reference.value)"
                  text-anchor="end"
                >
                  {{ reference.label }}
                </text>
              </g>
            </template>
          </g>
        </svg>

        <div v-if="legendVisible && legend === 'bottom'" class="csv-chart-foot">
          <div class="csv-chart-legend" :class="`legend-${legendAlign}`">
            <span
              v-for="(item, index) in model.series"
              :key="item.name"
              class="csv-chart-legend-item"
              :class="seriesClasses(item.name, index)"
            >
              <i class="csv-chart-swatch" />{{ item.name }}
            </span>
          </div>
        </div>
      </template>
          </div>
    </template>
    <figure v-else class="slidev-chart-figure" :style="figureStyle">
      <img v-if="src" :src="src" :alt="alt" :style="imageStyle" @error="retry" />
      <div v-else class="chart-error">{{ error || 'Chart: src を指定してください。' }}</div>
      <div v-if="failed" class="chart-error">
        図表を生成できません。`npm run dev` または `npm run build` のログを確認してください。
      </div>
    </figure>
  </div>
</template>

<style scoped>
.slidev-chart { display: flex; width: 100%; height: 100%; min-width: 0; min-height: 0; }
.slidev-chart-figure { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; min-width: 0; min-height: 0; margin: 0; }
.slidev-chart-figure img { display: block; width: 100%; height: 100%; max-width: 100%; max-height: 100%; }
.chart-error { color: #a52424; background: #fff0f0; border: 1px solid #e5aaaa; padding: 12px 16px; font-size: 16px; }

.csv-chart {
  width: 100%;
  color: var(--theme-ink, #243947);
  font-family: var(--theme-font, Arial, 'Hiragino Sans', 'Yu Gothic', sans-serif);
  background: var(--theme-bg, #fff);
}
.csv-chart-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 6px;
}
.csv-chart-title { font-size: 19px; font-weight: 700; line-height: 1.3; }
.csv-chart-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px 16px;
  color: var(--theme-muted, #627483);
  font-size: 14px;
  line-height: 1.3;
}
.csv-chart-legend.legend-left { order: -1; justify-content: flex-start; margin-right: auto; }
.csv-chart-legend.legend-right { order: 1; justify-content: flex-end; margin-left: auto; }
.csv-chart-foot { display: flex; margin-top: 8px; }
.csv-chart-foot .csv-chart-legend { width: 100%; }
.csv-chart-legend-item { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.csv-chart-swatch {
  display: inline-block;
  width: 22px;
  height: 0;
  border-top: 3px solid var(--series-color);
}
.csv-chart-svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.csv-chart-svg text { fill: var(--theme-ink, #243947); }
.csv-chart-grid line { stroke: var(--theme-gantt-grid, #e3e8ee); stroke-width: 1.2; }
.csv-chart-axis line { stroke: var(--theme-line, #ced8df); stroke-width: 1.4; }
.csv-chart-tick,
.csv-chart-axis-title { fill: var(--theme-muted, #627483) !important; font-size: 16px; }
.csv-chart-axis-title { font-size: 15px; }
.csv-chart-category { font-size: 17px; }
.csv-chart-value { fill: var(--theme-ink, #243947) !important; font-size: 16px; font-weight: 700; }
.csv-chart-bar { fill: var(--series-color); }
.csv-chart-line { stroke: var(--series-color); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
.csv-chart-point { fill: var(--series-color); stroke: var(--theme-bg, #fff); stroke-width: 2; }
.csv-chart-reference { stroke: var(--theme-bar-crit, #c85b5b); stroke-width: 1.5; stroke-dasharray: 7 5; }
.csv-chart-reference-label { fill: var(--theme-bar-crit, #c85b5b) !important; font-size: 14px; font-weight: 700; }
.csv-chart .series-0 { --series-color: var(--theme-bar-0, #5688b8); }
.csv-chart .series-1 { --series-color: var(--theme-bar-1, #599b72); }
.csv-chart .series-2 { --series-color: var(--theme-bar-2, #d3a146); }
.csv-chart .series-3 { --series-color: var(--theme-bar-3, #c87783); }
.csv-chart .is-emphasis { --series-color: var(--theme-accent, #005c97); }
.csv-chart .is-muted { --series-color: var(--theme-muted, #627483); }
.csv-chart .is-dashed .csv-chart-line { stroke-dasharray: 8 6; }
.csv-chart .is-dashed .csv-chart-swatch { border-top-style: dashed; }
.csv-chart-error,
.csv-chart-state {
  padding: 18px;
  border: 1px solid var(--theme-line, #ced8df);
  border-radius: 5px;
  background: var(--theme-soft, #eef4f8);
  color: var(--theme-muted, #627483);
  font-size: 15px;
}
.csv-chart-error {
  border-color: var(--theme-error-line, #e5aaaa);
  background: var(--theme-error-bg, #fff0f0);
  color: var(--theme-error-ink, #a52424);
}

.slidev-chart .csv-chart { height: 100%; }
.slidev-chart .csv-chart-svg { height: 100%; flex: 1; min-height: 0; }
</style>
