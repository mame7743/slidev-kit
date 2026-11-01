import { describe, expect, it } from 'vitest'
import { csvFetchUrl, normalizeCsvPath, parseManifest } from '../src/csv/client/load'

describe('csv load (fetch-based)', () => {
  it('normalizes data and public paths to the data folder', () => {
    expect(normalizeCsvPath('/data/trend.csv')).toBe('trend.csv')
    expect(normalizeCsvPath('data/trend.csv')).toBe('trend.csv')
    expect(normalizeCsvPath('public/data/trend.csv')).toBe('trend.csv')
    expect(normalizeCsvPath('trend.csv')).toBe('trend.csv')
  })

  it('builds fetch urls under the base path', () => {
    expect(csvFetchUrl('data/trend.csv')).toBe('/data/trend.csv')
    expect(csvFetchUrl('/data/trend.csv')).toBe('/data/trend.csv')
  })

  it('parses the manifest payload', () => {
    expect(parseManifest({ files: ['trend.csv', 'process.csv'] })).toEqual({
      files: ['trend.csv', 'process.csv'],
    })
    expect(parseManifest(null)).toEqual({ files: [] })
    expect(parseManifest({ files: [1, 'a.csv', null] })).toEqual({ files: ['a.csv'] })
  })
})
