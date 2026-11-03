#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import {
  deckInfo, getSlide, insertSlide, moveSlide, readProjectFile, removeSlide, updateSlide, writeProjectFile,
} from 'slidev-core/deck'

const root = process.env.SLIDEV_MCP_CWD || process.env.SLIDEV_AGENT_CWD || process.cwd()
const entry = process.env.SLIDEV_MCP_ENTRY || process.env.SLIDEV_AGENT_ENTRY || 'slides.md'
const require = createRequire(import.meta.url)
const sourceRoot = dirname(fileURLToPath(import.meta.url))

function kitFile(file) {
  const workspace = join(sourceRoot, '..', '..')
  const candidates = []
  // 同梱tarball（CLI package）を優先し、開発リポジトリでは theme / cli / core へフォールバックする。
  try { candidates.push(join(dirname(require.resolve('slidev-kit/package.json')), file)) } catch {}
  candidates.push(join(workspace, 'theme', file))
  candidates.push(join(workspace, 'cli', file))
  candidates.push(join(workspace, 'core', file === 'scripts/check.mjs' ? 'check.mjs' : file))
  const found = candidates.find((candidate) => existsSync(candidate))
  if (!found) throw new Error(`slidev-kit の ${file} が見つかりません。`)
  return found
}

function result(value) {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] }
}
function invoke(script, args) {
  const proc = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
  if (proc.error) throw proc.error
  if (proc.status !== 0) throw new Error((proc.stderr || proc.stdout || '').trim() || `コマンドが失敗しました (${proc.status})`)
  return (proc.stdout || '').trim()
}

const server = new McpServer({ name: 'slidev-kit', version: '0.2.2' })
const empty = {}
server.registerTool('deck_info', { description: 'デッキ情報、スライド一覧、ref/ の参考資料一覧を取得する。', inputSchema: empty }, async () => result(deckInfo(root, entry)))
server.registerTool('list_slides', { description: 'スライド番号・layout・title の一覧を取得する。', inputSchema: empty }, async () => result(deckInfo(root, entry).slides))
server.registerTool('get_slide', { description: '指定スライドの本文・frontmatter・ノートを取得する。', inputSchema: { no: z.number().int().min(1) } }, async ({ no }) => result(getSlide(root, entry, no)))
server.registerTool('update_slide', { description: 'スライド内容を部分更新する。frontmatter 値に null を渡すと削除する。', inputSchema: { no: z.number().int().min(1), content: z.string().optional(), note: z.string().optional(), frontmatter: z.record(z.string(), z.unknown()).optional() } }, async (params) => result(updateSlide(root, entry, params.no, params)))
server.registerTool('insert_slide', { description: '指定スライドの直後に挿入する。after=0 で先頭へ挿入。', inputSchema: { after: z.number().int().min(0), content: z.string(), note: z.string().optional(), frontmatter: z.record(z.string(), z.unknown()).optional() } }, async ({ after, ...slide }) => result(insertSlide(root, entry, after, slide)))
server.registerTool('remove_slide', { description: '指定スライドを削除する。', inputSchema: { no: z.number().int().min(1) } }, async ({ no }) => result(removeSlide(root, entry, no)))
server.registerTool('move_slide', { description: 'スライドを before または after の位置へ移動する。', inputSchema: { from: z.number().int().min(1), before: z.number().int().min(1).optional(), after: z.number().int().min(1).optional() } }, async ({ from, before, after }) => {
  if ((before == null) === (after == null)) throw new Error('before または after のどちらか一方を指定してください。')
  return result(moveSlide(root, entry, from, { before, after }))
})
server.registerTool('read_file', { description: 'プロジェクト内のテキストファイルを読む。', inputSchema: { file: z.string() } }, async ({ file }) => result(readProjectFile(root, file).content))
server.registerTool('write_file', { description: 'プロジェクト内のテキストファイルを書き込む。', inputSchema: { file: z.string().regex(/\.(md|csv|json|py|ts|vue|txt)$/i), content: z.string() } }, async ({ file, content }) => result(writeProjectFile(root, file, content)))
server.registerTool('list_layouts', { description: '利用可能なレイアウトを列挙する。', inputSchema: empty }, async () => result(readdirSync(kitFile('layouts')).filter(name => name.endsWith('.vue')).map(name => name.slice(0, -4))))
server.registerTool('validate_deck', { description: 'デッキを検査する。', inputSchema: empty }, async () => result(invoke(kitFile('scripts/check.mjs'), [entry])))
server.registerTool('build_deck', { description: '検査後にデッキをビルドする。', inputSchema: empty }, async () => result(invoke(kitFile('bin/cli.mjs'), ['build', entry])))
server.registerTool('export_pdf', { description: 'デッキを PDF に出力する。', inputSchema: { output: z.string().optional() } }, async ({ output }) => {
  const args = ['export', entry]
  if (output) args.push('--output', output)
  return result(invoke(join(dirname(require.resolve('slidev-runner/package.json')), 'src/cli.mjs'), args))
})

const transport = new StdioServerTransport()
await server.connect(transport)
