import { parseAndValidate } from '../csv/parse.mjs'

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char])
const n = value => Number.isFinite(Number(value)) ? Number(value) : 0
const text = (x, y, value, attrs = '') => `<text x="${x}" y="${y}" ${attrs}>${esc(value)}</text>`
const line = (x1, y1, x2, y2, attrs = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs}/>`

function color(theme, index, key) {
  return theme.series?.[key] || theme.colors?.palette?.[index % (theme.colors.palette.length || 1)] || ['#cc001e', '#494e52'][index % 2]
}

function chartSvg(job, presets, schemas, theme) {
  const config = { ...job.config }
  const preset = presets[config.preset]
  if (!preset) throw new Error(`不明な図表プリセットです: ${config.preset}`)
  Object.assign(config, preset, job.config)
  if (config.custom) throw new Error('Chart の custom Python レシピは廃止されました。標準プリセットを使用してください。')
  const schema = schemas[preset.schema]
  const { records } = parseAndValidate(job.csv, schema, { schemaName: preset.schema })
  const xKey = config.x || preset.x || 'category'
  const yKey = config.y || preset.y || 'value'
  const chart = config.chart || preset.chart || 'bar'
  let rows = [...records]
  if (config.sort === 'asc' || config.sort === 'desc') rows.sort((a, b) => String(a[xKey]).localeCompare(String(b[xKey]), undefined, { numeric: true }) * (config.sort === 'asc' ? 1 : -1))
  const width = 800, height = 450
  const colors = theme.colors || {}
  const font = `font-family="${esc((theme.fontFamily || ['Arial', 'sans-serif']).join(', '))}"`
  const fontSize = theme.fontSize || 12
  const title = config.title ? text(70, 34, config.title, `font-size="${theme.titleSize || 15}" font-weight="600" fill="${colors.text || '#24292d'}"`) : ''
  let body = ''
  const legends = []

  if (chart === 'donut') {
    const vals = rows.map(row => Math.max(0, n(row[yKey])))
    const sum = vals.reduce((a, b) => a + b, 0) || 1
    let angle = -Math.PI / 2
    const cx = 400, cy = 235, outer = 145, inner = 90
    body += `<circle cx="${cx}" cy="${cy}" r="${outer}" fill="${colors.grid || '#e3e6e8'}"/>`
    rows.forEach((row, i) => {
      const next = angle + vals[i] / sum * Math.PI * 2
      const x1 = cx + outer * Math.cos(angle), y1 = cy + outer * Math.sin(angle)
      const x2 = cx + outer * Math.cos(next), y2 = cy + outer * Math.sin(next)
      const ix2 = cx + inner * Math.cos(next), iy2 = cy + inner * Math.sin(next)
      const ix1 = cx + inner * Math.cos(angle), iy1 = cy + inner * Math.sin(angle)
      const large = next - angle > Math.PI ? 1 : 0
      body += `<path d="M ${x1} ${y1} A ${outer} ${outer} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z" fill="${color(theme, i)}"/>`
      const mid = (angle + next) / 2
      body += text(cx + 112 * Math.cos(mid), cy + 112 * Math.sin(mid) + 4, `${Math.round(vals[i] / sum * 100)}%`, `text-anchor="middle" font-size="${fontSize}" fill="${colors.background || '#fff'}"`)
      legends.push({ label: row[xKey], color: color(theme, i) })
      angle = next
    })
  } else {
    let categories = rows.map(row => String(row[xKey]))
    let series
    if (chart === 'line') {
      const cols = config.series || preset.series || [yKey]
      series = (Array.isArray(cols) ? cols : Object.keys(cols)).map((key, i) => ({ key, label: preset.labels?.[key] || key, color: config.series?.[key]?.color || color(theme, i, key), values: rows.map(row => n(row[key])), style: config.series?.[key] || {} }))
    } else if (chart === 'grouped-bar' || chart === 'stacked-bar') {
      const groupKey = config.group || preset.group || 'series'
      const groups = [...new Set(rows.map(row => String(row[groupKey])))]
      series = groups.map((key, i) => ({ key, label: key, color: config.series?.[key]?.color || color(theme, i, key), values: categories.map(cat => n(rows.find(row => String(row[xKey]) === cat && String(row[groupKey]) === key)?.[yKey])), style: config.series?.[key] || {} }))
    } else {
      series = [{ key: yKey, label: yKey, color: config.series?.[yKey]?.color || color(theme, 0, yKey), values: rows.map(row => n(row[yKey])), style: config.series?.[yKey] || {} }]
    }
    const all = series.flatMap(s => s.values)
    const min = Number(config.yMin ?? config.axes?.y?.min ?? Math.min(0, ...all))
    const max = Number(config.yMax ?? config.axes?.y?.max ?? Math.max(1, ...all) * 1.12)
    const plot = { x: 78, y: 76, w: 680, h: 300 }
    const y = value => plot.y + plot.h - (value - min) / (max - min || 1) * plot.h
    const ticks = 5
    for (let i = 0; i <= ticks; i++) {
      const value = min + (max - min) * i / ticks, yy = y(value)
      if (config.grid !== false) body += line(plot.x, yy, plot.x + plot.w, yy, `stroke="${colors.grid || '#e3e6e8'}" stroke-width="${theme.gridWidth || .6}"`)
      body += text(plot.x - 10, yy + 4, Number(value.toPrecision(3)), `text-anchor="end" font-size="${fontSize - 1}" fill="${colors.text || '#24292d'}"`)
    }
    body += line(plot.x, plot.y, plot.x, plot.y + plot.h, `stroke="${colors.sub || '#494e52'}"`)
    body += line(plot.x, plot.y + plot.h, plot.x + plot.w, plot.y + plot.h, `stroke="${colors.sub || '#494e52'}"`)
    const band = plot.w / Math.max(categories.length, 1)
    categories.forEach((cat, i) => body += text(plot.x + band * (i + .5), plot.y + plot.h + 24, cat, `text-anchor="middle" font-size="${fontSize - 1}" fill="${colors.text || '#24292d'}"`))
    if (config.xLabel) body += text(plot.x + plot.w / 2, height - 14, config.xLabel, `text-anchor="middle" font-size="${fontSize}" fill="${colors.text || '#24292d'}"`)
    if (config.yLabel) body += `<text transform="translate(18 ${plot.y + plot.h / 2}) rotate(-90)" text-anchor="middle" font-size="${fontSize}" fill="${colors.text || '#24292d'}">${esc(config.yLabel)}</text>`

    if (chart === 'line') {
      series.forEach((s, si) => {
        const points = s.values.map((v, i) => `${plot.x + band * (i + .5)},${y(v)}`)
        const dash = s.style.dash || (preset.dash || []).includes(s.key) ? ' stroke-dasharray="7 5"' : ''
        body += `<polyline points="${points.join(' ')}" fill="none" stroke="${s.color}" stroke-width="${s.style.width || theme.lineWidth || 2}"${dash}/>`
        s.values.forEach((v, i) => body += `<circle cx="${plot.x + band * (i + .5)}" cy="${y(v)}" r="3.5" fill="${s.color}"/>`)
        legends.push({ label: s.label, color: s.color })
      })
    } else if (chart === 'grouped-bar' || chart === 'stacked-bar') {
      categories.forEach((_, i) => {
        if (chart === 'stacked-bar') {
          let cumulative = 0
          series.forEach(s => { const v = s.values[i]; body += `<rect x="${plot.x + band * i + band * .2}" y="${y(cumulative + v)}" width="${band * .6}" height="${Math.max(0, y(cumulative) - y(cumulative + v))}" fill="${s.color}"/>`; cumulative += v })
        } else series.forEach((s, si) => {
          const bw = band * .72 / series.length, x = plot.x + band * i + band * .14 + bw * si
          body += `<rect x="${x}" y="${y(s.values[i])}" width="${bw}" height="${Math.max(0, y(0) - y(s.values[i]))}" fill="${s.color}"/>`
        })
      })
      series.forEach(s => legends.push({ label: s.label, color: s.color }))
    } else {
      const horizontal = Boolean(config.options?.horizontal)
      series[0].values.forEach((v, i) => {
        const bw = band * .62
        if (horizontal) body += `<rect x="${plot.x}" y="${plot.y + band * i + band * .18}" width="${(v - min) / (max - min || 1) * plot.w}" height="${bw}" fill="${series[0].color}"/>`
        else body += `<rect x="${plot.x + band * i + band * .19}" y="${Math.min(y(v), y(0))}" width="${bw}" height="${Math.abs(y(v) - y(0))}" fill="${series[0].color}"/>`
      })
    }
    const legend = config.legend ?? 'auto'
    if (legend !== false && legend !== 'none' && legends.length) {
      const start = plot.x + Math.max(0, (plot.w - legends.length * 110) / 2)
      legends.forEach((item, i) => {
        const lx = start + i * 110
        body += `<rect x="${lx}" y="${height - 34}" width="10" height="10" fill="${item.color}"/>` + text(lx + 15, height - 25, item.label, `font-size="${fontSize - 1}" fill="${colors.text || '#24292d'}"`)
      })
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(config.title || config.preset)}"><title>${esc(config.title || config.preset)}</title><rect width="100%" height="100%" fill="${colors.background || '#ffffff'}"/>${title}<g ${font}>${body}</g></svg>`
}

export function renderFigure(job, presets, schemas, theme) {
  return chartSvg(job, presets, schemas, theme)
}
