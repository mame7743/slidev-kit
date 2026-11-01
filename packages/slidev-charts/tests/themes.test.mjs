import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(import.meta.dirname, '..', 'src', 'themes')
const themes = readdirSync(dir).filter(name => name.endsWith('.json')).map(name => JSON.parse(readFileSync(join(dir, name), 'utf8')))

function luminance(hex) {
  const values = hex.replace('#', '').match(/../g).map(part => parseInt(part, 16) / 255)
  const linear = values.map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}
function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

describe('chart themes', () => {
  it('provides the required business color sets', () => {
    expect(themes.map(theme => theme.name).sort()).toEqual([
      'colorblind', 'company', 'consulting', 'corporate-blue', 'corporate-green', 'dark', 'finance', 'mono',
    ])
  })

  it('defines complete, unique hex palettes', () => {
    for (const theme of themes) {
      expect(theme.colors.palette.length, theme.name).toBeGreaterThanOrEqual(6)
      expect(new Set(theme.colors.palette).size, theme.name).toBe(theme.colors.palette.length)
      for (const value of [theme.colors.accent, theme.colors.sub, ...theme.colors.palette]) {
        expect(value, theme.name).toMatch(/^#[0-9a-f]{6}$/i)
      }
    }
  })

  it('keeps text readable against the background', () => {
    for (const theme of themes) {
      expect(contrast(theme.colors.text, theme.colors.background), theme.name).toBeGreaterThanOrEqual(4.5)
      expect(contrast(theme.colors.accent, theme.colors.background), theme.name).toBeGreaterThanOrEqual(3)
    }
  })
})
