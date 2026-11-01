import { describe, expect, it } from 'vitest'
import { buildCsvChart, buildScale, niceTicks } from '../src/csv/client/chart'
import { parseCsv, readCsvTable } from '../src/csv/client/parse'

const processCsv = `工程,工数
準備,4
モデル,6
解析,3
検証,5
報告,8`

const trendCsv = `月,計画,実績
4月,12,10
5月,14,13
6月,14,16
7月,15,14
8月,12,11
9月,16,17`

describe('csv parser', () => {
  it('reads BOM, CRLF, quoted commas and escaped quotes', () => {
    const text = '\uFEFFname,value\r\n"a,b",1\r\n"say ""hi""",2\r\n'
    expect(parseCsv(text)).toEqual([
      ['name', 'value'],
      ['a,b', '1'],
      ['say "hi"', '2'],
    ])
  })

  it('pads short rows and rejects empty headers', () => {
    expect(readCsvTable('a,b\n1')).toEqual({ headers: ['a', 'b'], rows: [['1', '']] })
    expect(() => readCsvTable('a,\n1,2')).toThrow(/空の列名/)
    expect(() => readCsvTable('a,b')).toThrow(/1行以上/)
  })

  it('ignores comment rows and skips leading metadata rows', () => {
    expect(readCsvTable('# metadata\n# metadata\na,b\n1,2')).toEqual({
      headers: ['a', 'b'],
      rows: [['1', '2']],
    })
    expect(readCsvTable('metadata\na,b\n1,2', 1)).toEqual({
      headers: ['a', 'b'],
      rows: [['1', '2']],
    })
    expect(() => readCsvTable('a,b\n1,2', 1)).toThrow(/1行以上/)
    expect(() => readCsvTable('a,b\n1,2', -1)).toThrow(/skipRows/)
  })
})

describe('csv chart model', () => {
  it('uses all numeric columns as series by default', () => {
    const model = buildCsvChart(trendCsv, { type: 'line', emphasis: '実績', dashed: '計画' })
    expect(model.labels).toEqual(['4月', '5月', '6月', '7月', '8月', '9月'])
    expect(model.series.map((item) => item.name)).toEqual(['計画', '実績'])
    expect(model.series[0].values).toEqual([12, 14, 14, 15, 12, 16])
    expect(model.max).toBe(20)
    expect(model.emphasis).toEqual(['実績'])
    expect(model.dashed).toEqual(['計画'])
  })

  it('supports horizontal single-series bars with emphasis', () => {
    const model = buildCsvChart(processCsv, {
      type: 'bar',
      horizontal: true,
      emphasis: '報告',
    })
    expect(model.series[0].values).toEqual([4, 6, 3, 5, 8])
    expect(model.max).toBe(8)
    expect(model.horizontal).toBe(true)
  })

  it('validates labels, series names and values', () => {
    expect(() => buildCsvChart(processCsv, { type: 'bar', label: '無い列' })).toThrow(/ラベル列/)
    expect(() => buildCsvChart(processCsv, { type: 'bar', series: '無い列' })).toThrow(/系列/)
    expect(() => buildCsvChart('a,b\nx,abc', { type: 'bar' })).toThrow(/数値の列/)
    expect(() => buildCsvChart('a,b\nx,-1', { type: 'bar', series: 'b' })).toThrow(/負の値/)
  })

  it('allows negative values for line charts but not bars', () => {
    const model = buildCsvChart('x,y\na,-5\nb,10', { type: 'line' })
    expect(model.series[0].values).toEqual([-5, 10])
    expect(model.min).toBe(-5)
    expect(model.max).toBe(10)
    expect(() => buildCsvChart('x,y\na,-5\nb,10', { type: 'bar' })).toThrow(/負の値/)
  })

  it('parses reference lines and expands the scale', () => {
    const model = buildCsvChart(trendCsv, { type: 'line', reference: '25,目標;15,下限' })
    expect(model.references).toEqual([
      { value: 25, label: '目標' },
      { value: 15, label: '下限' },
    ])
    expect(model.max).toBe(25)
    expect(() => buildCsvChart(trendCsv, { type: 'line', reference: 'abc,目標' })).toThrow(/reference/)
    expect(() => buildCsvChart(processCsv, { type: 'bar', reference: '-1,下限' })).toThrow(/referenceは0以上/)
  })

  it('creates readable ticks', () => {
    expect(niceTicks(17)).toEqual({ max: 20, ticks: [0, 5, 10, 15, 20] })
    expect(niceTicks(8)).toEqual({ max: 8, ticks: [0, 2, 4, 6, 8] })
    expect(niceTicks(0)).toEqual({ max: 1, ticks: [0, 1] })
  })

  it('supports explicit axis min, max and tick interval', () => {
    expect(buildScale([10, 17], { min: 10, max: 20, tickInterval: 2.5 })).toEqual({
      min: 10,
      max: 20,
      ticks: [10, 12.5, 15, 17.5, 20],
    })
    expect(buildScale([0, 8], { max: 20, tickCount: 5 })).toEqual({
      min: 0,
      max: 20,
      ticks: [0, 5, 10, 15, 20],
    })
    expect(buildScale([0, 8], { tickInterval: 3 })).toEqual({
      min: 0,
      max: 9,
      ticks: [0, 3, 6, 9],
    })
    expect(buildScale([-5, 10], { autoMin: true })).toEqual({
      min: -5,
      max: 10,
      ticks: [-5, 0, 5, 10],
    })
  })

  it('validates explicit axis settings', () => {
    expect(() => buildScale([10, 17], { min: 11 })).toThrow(/データ最小値/)
    expect(() => buildScale([10, 17], { max: 16 })).toThrow(/データ最大値/)
    expect(() => buildScale([0, 8], { tickInterval: 0 })).toThrow(/tickInterval/)
    expect(() => buildScale([0, 8], { tickCount: 1 })).toThrow(/tickCount/)
    expect(() => buildCsvChart(processCsv, { type: 'bar', min: 1 })).toThrow(/minは0/)
  })

  it('applies min and max to the chart model', () => {
    const model = buildCsvChart(trendCsv, { type: 'line', min: 10, max: 20, tickInterval: 2.5 })
    expect(model.min).toBe(10)
    expect(model.max).toBe(20)
    expect(model.ticks).toEqual([10, 12.5, 15, 17.5, 20])
  })

  it('skips metadata rows before the header', () => {
    const model = buildCsvChart('meta\n# comment\n工程,工数\n準備,4\n報告,8', {
      type: 'bar',
      skipRows: 1,
    })
    expect(model.labels).toEqual(['準備', '報告'])
    expect(model.series[0].values).toEqual([4, 8])
  })

  it('downsamples long line series with LTTB and keeps labels aligned', () => {
    const rows = Array.from({ length: 1000 }, (_, index) => `${index},${Math.sin(index / 10)}`).join('\n')
    const model = buildCsvChart(`x,y\n${rows}`, { type: 'line', maxPoints: 100 })
    expect(model.labels).toHaveLength(100)
    expect(model.series[0].values).toHaveLength(100)
    expect(model.labels[0]).toBe('0')
    expect(model.labels[99]).toBe('999')
  })
})
