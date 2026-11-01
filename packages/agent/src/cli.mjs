#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { createSlideAgent } from './agent.mjs'

const HELP = `slidev-agent — Slidev専用エージェント

使い方:
  slidev-agent run "進捗報告のスライドを作って" [options]
  slidev-agent chat [options]
  slidev-agent tools
  slidev-agent doctor

Options:
  --cwd=<dir>         作業ディレクトリ（既定: カレント）
  --entry=<file>      デッキ（既定: slides.md）
  --model=<provider/id>  例: anthropic/claude-sonnet-4-5
  --thinking=<level>  off / minimal / low / medium / high
  --session=<file>    会話履歴のJSONファイル

環境変数:
  SLIDEV_AGENT_MODEL  既定モデル（provider/id）
  ANTHROPIC_API_KEY など、pi-ai が解決するAPIキー`

const args = process.argv.slice(2)
const flags = new Map()
const positional = []
for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg.startsWith('--')) {
    const eq = arg.indexOf('=')
    if (eq > 0) flags.set(arg.slice(2, eq), arg.slice(eq + 1))
    else if (['--help', '-h'].includes(arg)) flags.set('help', 'true')
    else flags.set(arg.slice(2), args[++i])
  } else positional.push(arg)
}
const command = positional.shift()
const root = resolve(flags.get('cwd') || process.cwd())
const entry = flags.get('entry') || 'slides.md'
const modelSpec = flags.get('model') || process.env.SLIDEV_AGENT_MODEL
const thinkingLevel = flags.get('thinking') || 'low'
if (!['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'].includes(thinkingLevel)) throw new Error(`不明なthinking levelです: ${thinkingLevel}`)
const sessionPath = flags.get('session') ? resolve(flags.get('session')) : undefined

function loadMessages() {
  if (!sessionPath || !existsSync(sessionPath)) return undefined
  const value = JSON.parse(readFileSync(sessionPath, 'utf8'))
  if (!Array.isArray(value)) throw new Error(`セッションはメッセージ配列のJSONにしてください: ${sessionPath}`)
  return value
}

function saveMessages(agent) {
  if (sessionPath) {
    mkdirSync(dirname(sessionPath), { recursive: true })
    writeFileSync(sessionPath, JSON.stringify(agent.state.messages, null, 2))
  }
}

function printEvent(event) {
  if (event.type === 'message_update' && event.assistantMessageEvent.type === 'text_delta') {
    process.stdout.write(event.assistantMessageEvent.delta)
  } else if (event.type === 'tool_execution_start') {
    process.stdout.write(`\n[tool] ${event.toolName} ${JSON.stringify(event.args)}\n`)
  } else if (event.type === 'tool_execution_end') {
    if (event.isError) process.stdout.write(`[tool error] ${event.toolName}\n`)
  } else if (event.type === 'agent_end') {
    process.stdout.write('\n')
  }
}

async function makeAgent() {
  if (!existsSync(root)) throw new Error(`作業ディレクトリがありません: ${root}`)
  const messages = loadMessages()
  const { agent, model } = await createSlideAgent({ root, entry, modelSpec, thinkingLevel, messages })
  console.error(`[slidev-agent] model=${model.provider}/${model.id} cwd=${root} entry=${entry}`)
  agent.subscribe(printEvent)
  return agent
}

async function run(prompt) {
  const agent = await makeAgent()
  try {
    await agent.prompt(prompt)
    await agent.waitForIdle()
    saveMessages(agent)
  } finally {
    agent.abort()
  }
}

async function chat() {
  const agent = await makeAgent()
  const rl = createInterface({ input, output })
  try {
    for (;;) {
      const line = (await rl.question('> ')).trim()
      if (!line) continue
      if (['exit', 'quit', ':q'].includes(line)) break
      await agent.prompt(line)
      await agent.waitForIdle()
      saveMessages(agent)
    }
  } finally {
    rl.close()
    agent.abort()
  }
}

try {
  if (flags.get('help') || !command) console.log(HELP)
  else if (command === 'tools') {
    const { createSlideTools } = await import('./tools.mjs')
    for (const tool of createSlideTools(root, entry)) console.log(`${tool.name}\t${tool.description}`)
  } else if (command === 'doctor') {
    console.log(`Node ${process.versions.node}`)
    console.log(`cwd ${root}`)
    console.log(`entry ${entry}`)
    console.log(`model ${modelSpec || '(auto)'}`)
    console.log(`thinking ${thinkingLevel}`)
    console.log(`session ${sessionPath || '(none)'}`)
  } else if (command === 'run') {
    const prompt = positional.join(' ').trim()
    if (!prompt) throw new Error('プロンプトを指定してください。')
    await run(prompt)
  } else if (command === 'chat') {
    await chat()
  } else {
    throw new Error(`不明なコマンドです: ${command}`)
  }
} catch (error) {
  console.error(`[slidev-agent] ${error.message}`)
  process.exitCode = 1
}
