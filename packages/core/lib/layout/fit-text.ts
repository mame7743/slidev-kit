/** Find the largest readable integer size. The lower bound may still overflow. */
export function findLargestFontSize(min: number, max: number, fits: (size: number) => boolean): { size: number; overflow: boolean } {
  if (!fits(min)) return { size: min, overflow: true }
  let low = min
  let high = max
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (fits(middle)) low = middle
    else high = middle - 1
  }
  return { size: low, overflow: false }
}
