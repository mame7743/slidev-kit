import { describe, expect, it } from 'vitest'
import { decodeCsvBytes } from '../src/csv/client/encoding'

const sjis = new Uint8Array([0x8c, 0x8e, 0x2c, 0x92, 0x6c, 0x0a, 0x34, 0x8c, 0x8e, 0x2c, 0x31, 0x0a])

describe('csv encoding', () => {
  it('decodes UTF-8 automatically', () => {
    const bytes = new TextEncoder().encode('月,値\n4月,1\n')
    expect(decodeCsvBytes(bytes.buffer, 'auto')).toBe('月,値\n4月,1\n')
  })

  it('falls back to Shift-JIS for invalid UTF-8', () => {
    expect(decodeCsvBytes(sjis.buffer, 'auto')).toBe('月,値\n4月,1\n')
    expect(decodeCsvBytes(sjis.buffer, 'shift_jis')).toBe('月,値\n4月,1\n')
  })
})
