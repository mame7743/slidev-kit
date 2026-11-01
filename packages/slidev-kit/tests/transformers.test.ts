import { describe, it, expect } from 'vitest'
import setup from '../setup/transformers'

const transformer = async () => {
  const extras = await setup()
  return extras.codeblocks?.[0] as ((ctx: Record<string, unknown>) => string | undefined) | undefined
}

describe('gantt codeblock transformer', () => {
  it('converts only gantt fences', async () => {
    const transform = await transformer()
    expect(transform).toBeTruthy()
    const ctx = { info: 'gantt', code: 'gantt\nsection A\nTask :2026-11-02, 1d' }
    const html = transform!(ctx)
    expect(html).toContain('<GanttChart')
    const encoded = html!.match(/source-base64="([^"]+)"/)?.[1]
    expect(Buffer.from(encoded!, 'base64').toString('utf8')).toContain('section A')
    expect(transform!({ ...ctx, info: 'mermaid' })).toBeUndefined()
  })
})
