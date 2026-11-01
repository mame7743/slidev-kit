import type { GanttSpec, GanttData, Task } from './types'
export const DAY = 86400000
function date(s: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw Error(`日付形式が不正です: ${s}`)
  const [y,m,d] = s.split('-').map(Number)
  const ms = Date.UTC(y,m-1,d)
  if (new Date(ms).toISOString().slice(0,10) !== s) throw Error(`存在しない日付: ${s}`)
  return ms
}
function duration(s: string): number {
  const m = s.match(/^(\d+)(d|w)$/)
  if (!m) throw Error(`期間は 7d / 2w 形式で指定してください: ${s}`)
  return Number(m[1]) * (m[2] === 'w' ? 7 : 1) * DAY
}
export function resolveGantt(spec: GanttSpec): GanttData {
  const byId = new Map(spec.tasks.map(t=>[t.id,t]))
  if (byId.size !== spec.tasks.length) throw Error('タスクIDが重複しています')
  const cache = new Map<string,Task>(), visiting = new Set<string>()
  const resolve = (id: string): Task => {
    if (cache.has(id)) return cache.get(id)!
    const t = byId.get(id)
    if (!t) throw Error(`参照先タスクが見つかりません: ${id}`)
    if (visiting.has(id)) throw Error(`依存関係が循環しています: ${id}`)
    visiting.add(id)
    let start: number
    if (t.startToken.startsWith('after ')) start = resolve(t.startToken.slice(6).trim()).end
    else start = date(t.startToken)
    const end = /^\d+[dw]$/.test(t.endToken) ? start + duration(t.endToken) : date(t.endToken) + DAY
    if (end < start || (!t.milestone && end === start)) throw Error(`行${t.line}: 終了日が開始日以前です`)
    const task: Task = { id:t.id, label:t.label, section:t.section, status:t.status, milestone:t.milestone, start, end: t.milestone ? start : end, line:t.line }
    visiting.delete(id); cache.set(id,task); return task
  }
  const tasks = spec.tasks.map(t=>resolve(t.id))
  const min = Math.min(...tasks.map(t=>t.start))
  const max = Math.max(...tasks.map(t=>t.end || t.start)) + DAY
  return { title:spec.title, tasks, sections:spec.sections, min, max, tickInterval:spec.tickInterval, axisFormat:spec.axisFormat }
}
