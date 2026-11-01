import { Agent } from '@earendil-works/pi-agent-core'
import { builtinModels } from '@earendil-works/pi-ai/providers/all'
import { createSlideTools } from './tools.mjs'
import { slideSystemPrompt } from './system-prompt.mjs'

export function parseModelSpec(spec) {
  if (!spec) return undefined
  const separator = spec.indexOf('/')
  if (separator < 1 || separator === spec.length - 1) throw new Error(`モデルは provider/id 形式で指定してください: ${spec}`)
  return { provider: spec.slice(0, separator), id: spec.slice(separator + 1) }
}

export async function resolveModel(models, spec) {
  if (spec) {
    const { provider, id } = parseModelSpec(spec)
    const model = models.getModel(provider, id)
    if (!model) throw new Error(`モデルが見つかりません: ${spec}`)
    return model
  }
  const available = await models.getAvailable()
  if (available.length === 0) {
    throw new Error('利用可能なモデルがありません。SLIDEV_AGENT_MODEL=provider/id を指定するか、APIキーを設定してください。')
  }
  return available[0]
}

export async function createSlideAgent({ root, entry = 'slides.md', modelSpec, thinkingLevel = 'low', messages } = {}) {
  const models = builtinModels()
  const model = await resolveModel(models, modelSpec)
  const tools = createSlideTools(root, entry)
  const agent = new Agent({
    initialState: {
      systemPrompt: slideSystemPrompt(root, entry),
      model,
      thinkingLevel,
      tools,
      ...(messages ? { messages } : {}),
    },
    streamFn: models.streamSimple.bind(models),
  })
  return { agent, model, tools, models }
}
