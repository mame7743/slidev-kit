export type CsvTable = {
  headers: string[]
  rows: string[][]
}

/** RFC 4180相当（引用符・引用符内改行・CRLF・BOM）の最小CSVパーサー。 */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      pushField()
    } else if (char === '\n') {
      pushRow()
    } else if (char === '\r') {
      if (source[i + 1] === '\n') i++
      pushRow()
    } else {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) pushRow()

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''))
}

export function readCsvTable(text: string, skipRows = 0): CsvTable {
  if (!Number.isInteger(skipRows) || skipRows < 0) {
    throw new Error('skipRowsは0以上の整数で指定してください')
  }
  const rows = parseCsv(text).filter((row) => !row[0]?.trim().startsWith('#'))
  if (skipRows > 0) rows.splice(0, skipRows)
  if (rows.length < 2) throw new Error('CSVにヘッダーと1行以上のデータが必要です')
  const headers = rows[0].map((header) => header.trim())
  if (headers.some((header) => header === '')) throw new Error('CSVのヘッダーに空の列名があります')
  return {
    headers,
    rows: rows.slice(1).map((row) => headers.map((_, index) => row[index] ?? '')),
  }
}

export function parseCsvNumber(value: string): number {
  const raw = value.trim()
  if (raw === '') return Number.NaN
  return Number(raw.replace(/,/g, ''))
}
