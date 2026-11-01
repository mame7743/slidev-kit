import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { renderFigure } from '../src/vite/render.mjs'

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const presets = read('../src/presets/presets.json')
const schemas = read('../src/schemas/schemas.json')
const theme = read('../src/themes/company.json')
const cases = [
  ['bar-compare', 'category,value\nA,10\nB,20\n', 'category', 'value'],
  ['target-trend', 'period,actual,target\nQ1,10,12\nQ2,15,14\n', 'period', 'actual'],
  ['grouped-bar', 'period,series,value\nQ1,A,10\nQ1,B,15\nQ2,A,12\nQ2,B,18\n', 'period', 'value'],
  ['stacked-bar', 'period,series,value\nQ1,A,10\nQ1,B,15\nQ2,A,12\nQ2,B,18\n', 'period', 'value'],
  ['donut', 'category,value\nA,10\nB,20\n', 'category', 'value'],
]

describe('JavaScript SVG renderer', () => {
  it.each(cases)('renders %s without external runtimes', (preset, csv, x, y) => {
    const svg = renderFigure({ preset, config: { preset, src: 'data.csv', x, y }, csv }, presets, schemas, theme)
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
    expect(svg).toContain('<title>')
    expect(svg).toContain('</svg>')
    expect(svg).not.toContain('NaN')
  })

  it('renders Japanese labels and escapes XML special characters', () => {
    const svg = renderFigure({ preset: 'bar-compare', config: { preset: 'bar-compare', src: 'data.csv', title: '<売上&利益>' }, csv: 'category,value\n売上,10\n' }, presets, schemas, theme)
    expect(svg).toContain('&lt;売上&amp;利益&gt;')
  })
})
