import { describe, expect, it } from 'vitest'
import { lttbIndices } from '../src/csv/client/downsample'

describe('lttb', () => {
  it('keeps all points when the threshold is larger than the data', () => {
    expect(lttbIndices([1, 2, 3, 4], 10)).toEqual([0, 1, 2, 3])
    expect(lttbIndices([1, 2, 3], 0)).toEqual([0, 1, 2])
  })

  it('keeps the first and last points and preserves peaks', () => {
    const indices = lttbIndices([0, 10, 0, 10, 0], 3)
    expect(indices).toHaveLength(3)
    expect(indices[0]).toBe(0)
    expect(indices[indices.length - 1]).toBe(4)
    expect(indices[1]).toBe(1)
  })

  it('rejects invalid thresholds', () => {
    expect(() => lttbIndices([1, 2, 3], 2)).toThrow(/maxPoints/)
  })
})
