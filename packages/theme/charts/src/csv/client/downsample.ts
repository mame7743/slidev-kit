/**
 * LTTB（Largest Triangle Three Buckets）で間引くインデックスを返す。
 * 系列の形を保ちながら、先頭と末尾は必ず残す。
 */
export function lttbIndices(values: number[], threshold: number): number[] {
  const length = values.length
  if (threshold >= length || threshold <= 0) return values.map((_, index) => index)
  if (!Number.isInteger(threshold) || threshold < 3) {
    throw new Error('maxPointsは3以上の整数で指定してください（0で無効）')
  }
  if (length <= 2) return values.map((_, index) => index)

  const sampled = [0]
  const every = (length - 2) / (threshold - 2)
  let anchor = 0

  for (let bucket = 0; bucket < threshold - 2; bucket++) {
    const averageStart = Math.floor((bucket + 1) * every) + 1
    const averageEnd = Math.min(Math.floor((bucket + 2) * every) + 1, length)
    const averageLength = averageEnd - averageStart

    let averageX = 0
    let averageY = 0
    for (let index = averageStart; index < averageEnd; index++) {
      averageX += index
      averageY += values[index]
    }
    if (averageLength > 0) {
      averageX /= averageLength
      averageY /= averageLength
    } else {
      averageX = length - 1
      averageY = values[length - 1]
    }

    const rangeStart = Math.floor(bucket * every) + 1
    const rangeEnd = Math.floor((bucket + 1) * every) + 1
    const anchorX = anchor
    const anchorY = values[anchor]
    let maxArea = -1
    let selected = anchor

    for (let index = rangeStart; index < Math.min(rangeEnd, length); index++) {
      const area = Math.abs(
        (anchorX - averageX) * (values[index] - anchorY) - (anchorX - index) * (averageY - anchorY),
      )
      if (area > maxArea) {
        maxArea = area
        selected = index
      }
    }

    sampled.push(selected)
    anchor = selected
  }

  sampled.push(length - 1)
  return [...new Set(sampled)].sort((a, b) => a - b)
}
