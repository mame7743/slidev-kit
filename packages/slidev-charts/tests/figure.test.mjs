import { describe, expect, it } from 'vitest'
import { figureHash, normalizeFigureProps } from '../src/shared/figure.mjs'

describe('Figure props', () => {
  it('normalizes kebab-case props and defaults', () => {
    const { config } = normalizeFigureProps({ preset: 'target-trend', src: 'data/kpi.csv', 'y-min': 0, 'y-label': '達成率' })
    expect(config).toMatchObject({ preset: 'target-trend', src: 'data/kpi.csv', yMin: 0, yLabel: '達成率', theme: 'company' })
  })

  it('keeps display-only fit props out of unknown warnings', () => {
    const { config, unknown } = normalizeFigureProps({ src: 'a.csv', fit: 'cover' })
    expect(config.fit).toBe('cover')
    expect(unknown).toEqual([])
  })

  it('warns unknown props instead of silently dropping them', () => {
    const { unknown } = normalizeFigureProps({ src: 'a.csv', typo: true })
    expect(unknown).toEqual(['typo'])
  })

  it('requires src', () => {
    expect(() => normalizeFigureProps({ preset: 'bar-compare' })).toThrow(/src/)
  })

  it('hashes props independent of key order and changes with values', () => {
    const a = figureHash({ src: 'a.csv', preset: 'bar-compare', title: 'A' })
    const b = figureHash({ title: 'A', preset: 'bar-compare', src: 'a.csv' })
    const c = figureHash({ src: 'a.csv', preset: 'bar-compare', title: 'B' })
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })

  it('distinguishes the same CSV used by different presets', () => {
    expect(figureHash({ src: 'data/category.csv', preset: 'bar-compare' }))
      .not.toBe(figureHash({ src: 'data/category.csv', preset: 'donut' }))
  })
})
