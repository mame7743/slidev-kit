import { computed, ref, watch, type Ref } from 'vue'
import { buildCsvChart, type CsvChartModel } from './chart'
import { decodeCsvBytes } from './encoding'
import { csvFetchUrl, fetchAvailableCsv } from './load'

export function useCsvChart(props: Record<string, any>, enabled: Ref<boolean>) {
const W = 900
const H = 500

const source = ref('')
const loading = ref(false)
const loadError = ref('')
let loadToken = 0

const load = async (src: string) => {
  const token = ++loadToken
  loading.value = true
  try {
    const response = await fetch(csvFetchUrl(src))
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const body = decodeCsvBytes(await response.arrayBuffer(), props.encoding ?? 'auto')
    if (token !== loadToken) return
    if (!body.trim() || /^\s*</.test(body)) throw new Error('ファイルが見つかりません')
    source.value = body
    loadError.value = ''
  } catch (error) {
    if (token !== loadToken) return
    source.value = ''
    const available = await fetchAvailableCsv()
    const list = available.length ? ` / 利用可能: ${available.join(', ')}` : ''
    loadError.value = `CSVを読み込めません: ${src}（${(error as Error).message}）${list}`
  } finally {
    if (token === loadToken) loading.value = false
  }
}

watch(() => [props.src, enabled.value, props.encoding ?? 'auto', props.type], () => { if (enabled.value) load(props.src) }, { immediate: true })

const result = computed<{ model: CsvChartModel | null; error: string }>(() => {
  if (!source.value) return { model: null, error: '' }
  try {
    return {
      model: buildCsvChart(source.value, {
        type: props.type,
        label: props.label,
        series: props.series,
        emphasis: props.emphasis,
        dashed: props.dashed,
        reference: props.reference,
        skipRows: toNumber(props.skipRows),
        maxPoints: toNumber(props.maxPoints),
        horizontal: toBoolean(props.horizontal, false),
        min: toNumber(props.min),
        max: toNumber(props.max),
        tickInterval: toNumber(props.tickInterval),
        tickCount: toNumber(props.tickCount),
      }),
      error: '',
    }
  } catch (error) {
    return { model: null, error: (error as Error).message }
  }
})

const toBoolean = (value: boolean | string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback
  if (typeof value === 'boolean') return value
  const normalized = value.trim().toLowerCase()
  if (['false', '0', 'no', 'off'].includes(normalized)) return false
  if (['true', '1', 'yes', 'on', ''].includes(normalized)) return true
  return fallback
}

const toNumber = (value: number | string | undefined) => {
  if (value === undefined || value === '') return undefined
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const showCategoryLabels = computed(() => toBoolean(props.categoryLabels, true))
const showValueLabels = computed(() => toBoolean(props.valueLabels, true))
const showTickLabels = computed(() => toBoolean(props.tickLabels, true))

const model = computed(() => result.value.model)
const horizontal = computed(() => model.value?.type === 'bar' && model.value.horizontal)
const legend = computed(() => props.legend ?? 'top')
const legendAlign = computed(() => props.legendAlign ?? 'right')
const legendVisible = computed(() => legend.value !== 'none' && (model.value?.series.length ?? 0) > 1)
const layout = computed(() => {
  if (horizontal.value) {
    return {
      left: showCategoryLabels.value ? 150 : 36,
      right: showValueLabels.value ? 90 : 40,
      top: 18,
      bottom: 78,
    }
  }
  return { left: 92, right: 42, top: 18, bottom: showCategoryLabels.value ? 82 : 46 }
})
const plotW = computed(() => W - layout.value.left - layout.value.right)
const plotH = computed(() => H - layout.value.top - layout.value.bottom)

const axisMin = computed(() => model.value?.min ?? 0)
const axisRange = computed(() => Math.max(Number.EPSILON, (model.value?.max ?? 1) - axisMin.value))
const yScale = (value: number) => layout.value.top + plotH.value * (1 - (value - axisMin.value) / axisRange.value)
const xScale = (value: number) => layout.value.left + ((value - axisMin.value) / axisRange.value) * plotW.value
const rowBand = computed(() => plotH.value / Math.max(1, model.value?.labels.length ?? 1))
const rowCenter = (index: number) => layout.value.top + rowBand.value * (index + 0.5)
const xAt = (index: number) =>
  layout.value.left + ((index + 0.5) * plotW.value) / Math.max(1, model.value?.labels.length ?? 1)
const labelStride = computed(() => Math.max(1, Math.ceil((model.value?.labels.length ?? 0) / 10)))

const hBarHeight = computed(() => {
  const count = Math.max(1, model.value?.series.length ?? 1)
  return Math.min(44, (rowBand.value * 0.68) / count)
})
const hBarY = (row: number, seriesIndex: number) => {
  const groupHeight = hBarHeight.value * Math.max(1, model.value?.series.length ?? 1)
  return layout.value.top + rowBand.value * row + (rowBand.value - groupHeight) / 2 + seriesIndex * hBarHeight.value
}

const vBarWidth = computed(() => {
  const band = plotW.value / Math.max(1, model.value?.labels.length ?? 1)
  return Math.min(64, (band * 0.68) / Math.max(1, model.value?.series.length ?? 1))
})
const vBarX = (row: number, seriesIndex: number) => {
  const band = plotW.value / Math.max(1, model.value?.labels.length ?? 1)
  const groupWidth = vBarWidth.value * Math.max(1, model.value?.series.length ?? 1)
  return layout.value.left + band * row + (band - groupWidth) / 2 + seriesIndex * vBarWidth.value
}
const vBarHeight = (value: number) => Math.max(0, yScale(axisMin.value) - yScale(value))

const points = (values: number[]) => values.map((value, index) => `${xAt(index)},${yScale(value)}`).join(' ')

const seriesClasses = (name: string, index: number, label?: string) => {
  const current = model.value
  const classes = [`series-${index % 4}`]
  if (current && current.emphasis.length > 0) {
    const matched = current.emphasis.includes(name) || (label !== undefined && current.emphasis.includes(label))
    classes.push(matched ? 'is-emphasis' : 'is-muted')
  }
  if (current?.dashed.includes(name)) classes.push('is-dashed')
  return classes
}

const formatValue = (value: number) => {
  const rounded = Number(value.toPrecision(12))
  return Number.isInteger(rounded) ? String(rounded) : rounded.toString()
}

const tooltip = (name: string, label: string, value: number) =>
  `${name} / ${label}: ${formatValue(value)}`

const referenceAnchor = (value: number) =>
  xScale(value) > layout.value.left + plotW.value * 0.75 ? 'end' : 'start'
const referenceLabelX = (value: number) =>
  xScale(value) + (referenceAnchor(value) === 'end' ? -6 : 6)
const referenceLabelY = (value: number) => {
  const y = yScale(value)
  return y < layout.value.top + 22 ? y + 18 : y - 6
}

  return {
    W, H, source, loading, loadError, result, model, horizontal, legendVisible, legend, legendAlign,
    layout, plotW, plotH, axisMin, axisRange, yScale, xScale, rowBand, rowCenter, xAt, labelStride,
    hBarHeight, hBarY, vBarWidth, vBarX, vBarHeight, points, seriesClasses, formatValue, tooltip,
    referenceAnchor, referenceLabelX, referenceLabelY, showCategoryLabels, showValueLabels, showTickLabels,
  }
}
