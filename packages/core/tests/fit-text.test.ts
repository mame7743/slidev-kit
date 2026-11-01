import { expect, it } from 'vitest'
import { findLargestFontSize } from '../lib/layout/fit-text'
it('keeps the selected size when content fits', () => {
  expect(findLargestFontSize(18, 32, () => true)).toEqual({ size: 32, overflow: false })
})
it('finds the largest size allowed by the most crowded column', () => {
  expect(findLargestFontSize(18, 32, n => n <= 23)).toEqual({ size: 23, overflow: false })
})
it('reports overflow rather than going below the readable lower bound', () => {
  expect(findLargestFontSize(18, 32, () => false)).toEqual({ size: 18, overflow: true })
})
