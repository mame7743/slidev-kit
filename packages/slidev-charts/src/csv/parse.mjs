export class CsvError extends Error {
  constructor(message, { row, column } = {}) {
    const where = [row ? `${row}行目` : '', column ? `列 ${column}` : ''].filter(Boolean).join(' / ')
    super(where ? `${message} (${where})` : message)
    this.name = 'CsvError'
    this.row = row
    this.column = column
  }
}

export function parseCsv(text) {
  const input = text.replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') { field += '"'; i++ }
        else quoted = false
      } else field += char
      continue
    }
    if (char === '"') { quoted = true; continue }
    if (char === ',') { row.push(field); field = ''; continue }
    if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue }
    if (char === '\r') {
      if (input[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
      continue
    }
    field += char
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  if (quoted) throw new CsvError('CSVの引用符が閉じられていません。')
  const nonEmpty = rows.filter(cells => cells.some(cell => cell.trim() !== ''))
  if (nonEmpty.length === 0) throw new CsvError('CSVが空です。')
  const headers = nonEmpty[0].map(header => header.trim())
  if (headers.some(header => !header)) throw new CsvError('CSVのヘッダーに空の列名があります。', { row: 1 })
  const records = nonEmpty.slice(1).map((cells, index) => {
    const record = { __row: index + 2 }
    headers.forEach((header, column) => { record[header] = (cells[column] ?? '').trim() })
    return record
  })
  return { headers, records }
}

function toNumber(value) {
  const normalized = value.replace(/,/g, '').replace(/%$/, '')
  const number = Number(normalized)
  return Number.isFinite(number) ? number : undefined
}

export function validateRecords(records, schema, { schemaName } = {}) {
  const missing = schema.required.filter(column => !records.length || !(column in records[0]))
  if (missing.length) throw new CsvError(`スキーマ ${schemaName} に必要な列がありません: ${missing.join(', ')}`, { row: 1, column: missing[0] })
  for (const record of records) {
    for (const [column, type] of Object.entries(schema.columns)) {
      if (!(column in record)) continue
      const value = record[column]
      if (type === 'number') {
        if (value === '') throw new CsvError(`必須の数値が空です: ${column}`, { row: record.__row, column })
        if (toNumber(value) === undefined) throw new CsvError(`数値として読めません: ${column} = "${value}"`, { row: record.__row, column })
      } else if (schema.required.includes(column) && value === '') {
        throw new CsvError(`必須の値が空です: ${column}`, { row: record.__row, column })
      }
    }
  }
  return records.map(record => {
    const result = { ...record }
    for (const [column, type] of Object.entries(schema.columns)) {
      if (type === 'number' && result[column] !== undefined && result[column] !== '') result[column] = toNumber(result[column])
    }
    return result
  })
}

export function parseAndValidate(text, schema, options) {
  const { headers, records } = parseCsv(text)
  return { headers, records: validateRecords(records, schema, options) }
}
