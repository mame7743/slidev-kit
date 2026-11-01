import { describe, expect, it } from 'vitest'
import { parseCsv, parseAndValidate, CsvError } from '../src/csv/parse.mjs'

const schema = {
  columns: { period: 'string', actual: 'number', target: 'number' },
  required: ['period', 'actual', 'target'],
}

describe('CSV parser', () => {
  it('reads UTF-8 BOM, Japanese labels and quoted commas', () => {
    const { headers, records } = parseCsv('\uFEFFperiod,actual,target\n4月,"1,200",75\n5月,71,75\n')
    expect(headers).toEqual(['period', 'actual', 'target'])
    expect(records[0].period).toBe('4月')
    expect(records[0].actual).toBe('1,200')
  })

  it('validates numbers and returns row/column errors', () => {
    expect(() => parseAndValidate('period,actual,target\n4月,x,75\n', schema, { schemaName: 'target' }))
      .toThrowError(/2行目.*actual/)
    expect(() => parseAndValidate('period,actual\n4月,62\n', schema, { schemaName: 'target' }))
      .toThrowError(/target/)
    expect(() => parseAndValidate('', schema, { schemaName: 'target' })).toThrowError(/空/)
  })

  it('normalizes thousands separators and percent values', () => {
    const { records } = parseAndValidate('period,actual,target\n4月,"1,200",75%\n', schema, { schemaName: 'target' })
    expect(records[0].actual).toBe(1200)
    expect(records[0].target).toBe(75)
  })

  it('reports unterminated quotes', () => {
    expect(() => parseCsv('a,b\n"x,1\n')).toThrow(CsvError)
  })
})
