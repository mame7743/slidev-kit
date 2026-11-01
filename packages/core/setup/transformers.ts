import { defineCodeblockTransformer, defineTransformersSetup } from '@slidev/types'
// gantt フェンスのみ処理。通常の mermaid は Slidev 標準レンダラーに任せる。
const ganttBlock = defineCodeblockTransformer((ctx) => {
  if (ctx.info.split(/\s+/)[0] !== 'gantt') return
  const code = ctx.code.trim()
  const encoded = Buffer.from(code, 'utf8').toString('base64')
  return `<GanttChart source-base64="${encoded}" />`
})
export default defineTransformersSetup(() => ({ codeblocks: [ganttBlock] }))
