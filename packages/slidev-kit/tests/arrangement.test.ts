import { describe, expect, it } from 'vitest'
import { resolveArrangement, resolveColumns, resolveRatio } from '../lib/layout/arrangement'
describe('content arrangement inputs', () => {
  it('falls back for unknown or inherited names', () => {
    for (const value of ['constructor', '__proto__', 'unknown', null, 42])
      expect(resolveArrangement(value)).toBe('single')
    expect(resolveArrangement('main-detail')).toBe('main-detail')
  })
  it('only accepts positive two-column ratios', () => {
    expect(resolveRatio('7:3', '1fr 1fr')).toBe('7fr 3fr')
    for (const value of ['0:3', '1:0', '1:2; color:red', undefined])
      expect(resolveRatio(value, '3fr 2fr')).toBe('3fr 2fr')
  })
  it('normalizes numeric and quoted column counts', () => {
    expect(resolveColumns(2)).toBe(2)
    expect(resolveColumns('2')).toBe(2)
    expect(resolveColumns(3)).toBe(3)
    for (const value of [1, 4, 'x', null, undefined])
      expect(resolveColumns(value)).toBeUndefined()
  })
})
