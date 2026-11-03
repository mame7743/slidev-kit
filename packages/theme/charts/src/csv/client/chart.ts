import { lttbIndices } from './downsample'
import { parseCsvNumber, readCsvTable } from './parse'

export type CsvChartType = 'bar' | 'line'

export type CsvChartOptions = {
  type: CsvChartType
  label?: string
  series?: string
  emphasis?: string
  dashed?: string
  horizontal?: boolean
  min?: number
  max?: number
  tickInterval?: number
  tickCount?: number
  reference?: string
  skipRows?: number
  maxPoints?: number
}

export type CsvChartReference = {
  value: number
  label: string
}

export type CsvChartSeries = {
  name: string
  values: number[]
}

export type CsvChartModel = {
  type: CsvChartType
  horizontal: boolean
  labels: string[]
  series: CsvChartSeries[]
  min: number
  max: number
  ticks: number[]
  references: CsvChartReference[]
  emphasis: string[]
  dashed: string[]
}

export type CsvScaleOptions = {
  min?: number
  max?: number
  tickInterval?: number
  tickCount?: number
  autoMin?: boolean
}

const splitNames = (value?: string) =>
  value
    ? value
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
    : []

const parseReferences = (value?: string): CsvChartReference[] => {
  if (!value) return []
  return value
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const comma = entry.indexOf(',')
      const rawValue = comma >= 0 ? entry.slice(0, comma).trim() : entry
      const label = comma >= 0 ? entry.slice(comma + 1).trim() : ''
      const number = parseCsvNumber(rawValue)
      if (!Number.isFinite(number)) throw new Error(`referenceの値が数値ではありません: ${entry}`)
      return { value: number, label }
    })
}

/** 0〜maxValueを等間隔に区切る、読みやすい目盛りを作る。 */
export function niceTicks(maxValue: number, count = 5): { max: number; ticks: number[] } {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return { max: 1, ticks: [0, 1] }
  const rough = maxValue / count
  const exponent = 10 ** Math.floor(Math.log10(rough))
  const fraction = rough / exponent
  const step = (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * exponent
  const max = Math.ceil(maxValue / step) * step
  const ticks: number[] = []
  for (let value = 0; value <= max + step / 2; value += step) {
    ticks.push(Number(value.toFixed(10)))
  }
  return { max, ticks }
}

const roundValue = (value: number) => Number(value.toPrecision(12))

/** min・max・目盛り間隔を解決する。未指定ならデータから自動計算する。 */
export function buildScale(values: number[], options: CsvScaleOptions = {}): { min: number; max: number; ticks: number[] } {
  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) throw new Error('グラフの数値がありません')

  const tickCount = options.tickCount ?? 5
  if (!Number.isInteger(tickCount) || tickCount < 2) {
    throw new Error('tickCountは2以上の整数で指定してください')
  }

  const interval = options.tickInterval
  if (interval !== undefined && (!Number.isFinite(interval) || interval <= 0)) {
    throw new Error('tickIntervalは正の数で指定してください')
  }

  let min = options.min
  let step = interval
  let max = options.max

  if (min !== undefined) {
    if (!Number.isFinite(min)) throw new Error('minは数値で指定してください')
  } else if (options.autoMin && dataMin < 0) {
    const lower = Math.min(0, dataMin)
    const upper = Math.max(0, dataMax)
    const auto = niceTicks(upper - lower, tickCount)
    if (step === undefined) {
      step = auto.ticks.length > 1 ? auto.ticks[1] - auto.ticks[0] : auto.max
    }
    min = Math.floor(lower / step) * step
  } else {
    min = 0
  }

  if (min > dataMin) throw new Error(`min（${min}）がデータ最小値（${dataMin}）を超えています`)

  if (max !== undefined) {
    if (!Number.isFinite(max)) throw new Error('maxは数値で指定してください')
    if (max <= min) throw new Error(`max（${max}）はmin（${min}）より大きくしてください`)
    if (max < dataMax) throw new Error(`max（${max}）がデータ最大値（${dataMax}）より小さくなっています`)
  }

  if (step === undefined) {
    if (max === undefined) {
      const auto = niceTicks(dataMax - min, tickCount)
      max = min + auto.max
      return {
        min,
        max: roundValue(max),
        ticks: auto.ticks.map((tick) => roundValue(min + tick)),
      }
    }
    step = (max - min) / Math.max(1, tickCount - 1)
  } else if (max === undefined) {
    max = min + Math.ceil((dataMax - min) / step) * step
    if (max <= min) max = min + step
  }
  if (step === undefined || max === undefined) throw new Error('目盛りを計算できません')

  const ticks: number[] = []
  for (let index = 0; index <= 1000; index++) {
    const value = min + index * step
    if (value > max + step * 1e-9) break
    ticks.push(roundValue(value))
    if (ticks.length > 200) throw new Error('目盛りが多すぎます。tickIntervalを大きくしてください')
  }
  if (ticks.length === 0) ticks.push(min)
  if (ticks[ticks.length - 1] < max - step * 1e-9) ticks.push(roundValue(max))
  return { min, max: roundValue(max), ticks }
}

export function buildCsvChart(text: string, options: CsvChartOptions): CsvChartModel {
  const { headers, rows } = readCsvTable(text, options.skipRows ?? 0)
  const labelIndex = options.label ? headers.indexOf(options.label) : 0
  if (labelIndex < 0) throw new Error(`ラベル列「${options.label}」がCSVにありません`)

  const isNumericColumn = (index: number) =>
    rows.every((row) => Number.isFinite(parseCsvNumber(row[index] ?? '')))

  const requested = splitNames(options.series)
  const seriesNames = requested.length
    ? requested
    : headers.filter((_, index) => index !== labelIndex && isNumericColumn(index))

  if (seriesNames.length === 0) {
    throw new Error('数値の列がありません。series属性で列名を指定してください')
  }
  for (const name of seriesNames) {
    if (!headers.includes(name)) throw new Error(`系列「${name}」がCSVにありません`)
    if (headers.indexOf(name) === labelIndex) throw new Error(`系列「${name}」はラベル列です`)
  }

  let labels = rows.map((row) => (row[labelIndex] ?? '').trim())
  if (labels.some((label) => label === '')) throw new Error('ラベル列に空欄があります')

  let series = seriesNames.map((name) => {
    const index = headers.indexOf(name)
    const values = rows.map((row) => {
      const raw = (row[index] ?? '').trim()
      const value = parseCsvNumber(raw)
      if (!Number.isFinite(value)) throw new Error(`「${name}」に数値でない値があります: ${raw || '(空欄)'}`)
      if (value < 0 && options.type === 'bar') throw new Error(`「${name}」に負の値があります: ${raw}（棒グラフは0以上）`)
      return value
    })
    return { name, values }
  })

  const references = parseReferences(options.reference)
  if (options.type === 'bar' && references.some((reference) => reference.value < 0)) {
    throw new Error('棒グラフのreferenceは0以上にしてください')
  }

  const scale = buildScale([...series.flatMap((item) => item.values), ...references.map((reference) => reference.value)], {
    min: options.min,
    max: options.max,
    tickInterval: options.tickInterval,
    tickCount: options.tickCount,
    autoMin: options.type === 'line',
  })
  if (options.type === 'bar' && scale.min !== 0) {
    throw new Error('棒グラフのminは0にしてください（棒の長さが誤解を招くため）')
  }

  const maxPoints = options.maxPoints ?? 500
  if (!Number.isFinite(maxPoints) || maxPoints < 0 || (maxPoints > 0 && maxPoints < 3)) {
    throw new Error('maxPointsは3以上の整数で指定してください（0で無効）')
  }
  if (options.type === 'line' && maxPoints > 0 && labels.length > maxPoints) {
    const indices = lttbIndices(series[0].values, maxPoints)
    labels = indices.map((index) => labels[index])
    series = series.map((item) => ({
      name: item.name,
      values: indices.map((index) => item.values[index]),
    }))
  }

  return {
    type: options.type,
    horizontal: options.horizontal === true,
    labels,
    series,
    min: scale.min,
    max: scale.max,
    ticks: scale.ticks,
    references,
    emphasis: splitNames(options.emphasis),
    dashed: splitNames(options.dashed),
  }
}
