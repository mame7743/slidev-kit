import { describe,it,expect } from 'vitest'
import { parseGantt } from '../../theme/lib/gantt/parser'
import { resolveGantt,DAY } from '../../theme/lib/gantt/resolver'
const src = `gantt\n dateFormat YYYY-MM-DD\n section 準備\n 仕様 :done, a1, 2026-11-02, 10d\n section 開発\n 実装 :b1, after a1, 7d\n 判定 :milestone, m1, after b1, 0d`
describe('gantt',()=>{
 it('parses sections and statuses',()=>{const p=parseGantt(src);expect(p.sections).toEqual(['準備','開発']);expect(p.tasks[0].status).toBe('done')})
 it('resolves dependencies and milestone',()=>{const d=resolveGantt(parseGantt(src));expect(d.tasks[1].start).toBe(d.tasks[0].end);expect(d.tasks[2].start).toBe(d.tasks[1].end);expect(d.tasks[2].milestone).toBe(true)})
 it('supports end dates',()=>{const d=resolveGantt(parseGantt('gantt\n section A\n Task :2026-11-02, 2026-11-03'));expect(d.tasks[0].end-d.tasks[0].start).toBe(2*DAY)})
 it('rejects unknown syntax',()=>expect(()=>parseGantt('gantt\n something else')).toThrow())
 it('rejects cycles',()=>expect(()=>resolveGantt(parseGantt('gantt\n A :a, after b, 1d\n B :b, after a, 1d'))).toThrow(/循環/))
})
