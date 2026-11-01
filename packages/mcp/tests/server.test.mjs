import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'

const server = fileURLToPath(new URL('../src/cli.mjs', import.meta.url))

describe('Slidev MCP server', () => {
  it('answers initialize and exposes slide tools over stdio', () => {
    const input = [
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1' } } },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    ].map(message => JSON.stringify(message)).join('\n') + '\n'
    const result = spawnSync(process.execPath, [server], { input, encoding: 'utf8', timeout: 10_000 })
    expect(result.status).toBe(0)
    const messages = result.stdout.trim().split(/\r?\n/).map(line => JSON.parse(line))
    expect(messages[0].result.serverInfo.name).toBe('slidev-kit')
    const names = messages[1].result.tools.map(tool => tool.name)
    expect(names).toContain('deck_info')
    expect(names).toContain('update_slide')
    expect(names).toContain('validate_deck')
  })
})
