import type { GanttSpec, TaskSpec, Status } from './types'
const directives = new Set(['title','dateFormat','axisFormat','tickInterval','excludes','todayMarker','inclusiveEndDates','weekday','weekend'])
export function parseGantt(source: string): GanttSpec {
  const result: GanttSpec = { title: '', dateFormat: 'YYYY-MM-DD', axisFormat: '%m/%d', tickInterval: '1week', excludes: [], tasks: [], sections: [] }
  let section = '工程'
  let sawGantt = false
  for (const [index, raw] of source.split(/\r?\n/).entries()) {
    const line = raw.trim()
    if (!line || line.startsWith('%%')) continue
    if (line === 'gantt') { sawGantt = true; continue }
    if (line.startsWith('section ')) { section = line.slice(8).trim(); if (!section) throw Error(`行${index+1}: section名が空です`); if (!result.sections.includes(section)) result.sections.push(section); continue }
    const head = line.split(/\s+/)[0]
    if (directives.has(head)) {
      const value = line.slice(head.length).trim()
      if (head === 'title') result.title = value
      else if (head === 'dateFormat') result.dateFormat = value
      else if (head === 'axisFormat') result.axisFormat = value
      else if (head === 'tickInterval') result.tickInterval = value
      else if (head === 'excludes') result.excludes = value.split(/[ ,]+/).filter(Boolean)
      else if (head === 'inclusiveEndDates' && value !== '') throw Error(`行${index+1}: inclusiveEndDatesは未対応です`)
      else if (head === 'weekday' || head === 'weekend') throw Error(`行${index+1}: ${head}は未対応です`)
      continue
    }
    const colon = line.indexOf(':')
    if (colon < 1) throw Error(`行${index+1}: 未対応の構文: ${line}`)
    const label = line.slice(0, colon).trim()
    const tokens = line.slice(colon+1).split(',').map(v=>v.trim()).filter(Boolean)
    let status: Status = 'normal', milestone = false
    while (tokens.length && ['done','active','crit','milestone'].includes(tokens[0])) {
      const t = tokens.shift()!
      if (t === 'milestone') milestone = true
      else status = t as Status
    }
    const rest = tokens
    if (rest.length !== 2 && rest.length !== 3) throw Error(`行${index+1}: タスクは「ID, 開始日, 期間」または「開始日, 期間」で指定してください`)
    const [id, startToken, endToken] = rest.length === 3 ? rest : [`task_${index+1}`, rest[0], rest[1]]
    const task: TaskSpec = { id, label, section, status, milestone, startToken, endToken, line: index+1 }
    if (!result.sections.includes(section)) result.sections.push(section)
    result.tasks.push(task)
  }
  if (!sawGantt) throw Error('先頭に gantt が必要です')
  if (!result.tasks.length) throw Error('タスクがありません')
  if (result.dateFormat !== 'YYYY-MM-DD') throw Error(`dateFormat ${result.dateFormat} は未対応です（YYYY-MM-DDのみ）`)
  if (result.excludes.length) throw Error('excludesは現バージョンでは未対応です。休日を除いた期間計算はまだ行いません')
  return result
}
