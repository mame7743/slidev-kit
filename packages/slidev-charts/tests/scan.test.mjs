import { describe, expect, it } from 'vitest'
import { scanMarkdown } from '../src/vite/scan.mjs'

describe('Chart tag scanner', () => {
  it('parses static and literal object props', () => {
    const [tag] = scanMarkdown('<Chart preset="target-trend" src="data/kpi.csv" :axes="{ y: { min: 0 } }" />')
    expect(tag.props).toEqual({ preset: 'target-trend', src: 'data/kpi.csv', axes: { y: { min: 0 } } })
  })

  it('recognizes Chart tags and CSV mode tags', () => {
    const [preset, csv] = scanMarkdown('<Chart preset="bar-compare" src="a.csv" />\n<Chart type="bar" src="a.csv" />')
    expect(preset.tag).toBe('Chart')
    expect(preset.props.preset).toBe('bar-compare')
    expect(csv.tag).toBe('Chart')
    expect(csv.props.type).toBe('bar')
  })

  it('ignores fenced and inline code', () => {
    expect(scanMarkdown('```md\n<Chart preset="x" src="a.csv" />\n```\n`<Chart preset="y" src="b.csv" />`')).toEqual([])
  })

  it('rejects non-literal expressions', () => {
    expect(() => scanMarkdown('<Chart preset="x" src="a.csv" :axes="makeAxes()" />')).toThrow(/リテラル/)
  })

  it('rejects non-self-closing tags', () => {
    expect(() => scanMarkdown('<Chart preset="x" src="a.csv"></Chart>')).toThrow(/自己終了/)
  })
})
