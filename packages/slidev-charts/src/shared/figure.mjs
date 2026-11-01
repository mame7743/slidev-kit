export const knownProps = new Set([
  'preset', 'src', 'chart', 'title', 'width', 'height', 'aspect', 'fit', 'theme',
  'x', 'y', 'group', 'sort',
  'xMin', 'xMax', 'yMin', 'yMax', 'xLabel', 'yLabel', 'legend', 'grid',
  'axes', 'series', 'annotations', 'layout', 'options', 'custom',
])

export function hashString(input) {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export function normalizeFigureProps(raw = {}) {
  const config = {}
  const unknown = []
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue
    const camel = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    if (!knownProps.has(camel)) {
      unknown.push(key)
      continue
    }
    config[camel] = value
  }
  config.preset ||= 'bar-compare'
  config.theme ||= 'company'
  if (!config.src || typeof config.src !== 'string') throw new Error('Chart: `src` にCSVファイルを指定してください。')
  return { config, unknown }
}

export function figureHash(raw) {
  const { config } = normalizeFigureProps(raw)
  return `fig-${hashString(canonical(config))}`
}

export function figureHashFromConfig(config) {
  return `fig-${hashString(canonical(config))}`
}
