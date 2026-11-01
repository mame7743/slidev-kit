<script setup lang="ts">
import { computed } from 'vue'
import { parseGantt } from '../../lib/gantt/parser'
import { resolveGantt, DAY } from '../../lib/gantt/resolver'
import type { Task } from '../../lib/gantt/types'
import FitBox from './FitBox.vue'
const props = defineProps<{ sourceBase64: string; scale?: 'auto'|'week'|'month'; variant?: 'bar'|'line' }>()
const source = computed(() => {
  try { return new TextDecoder().decode(Uint8Array.from(atob(props.sourceBase64), c=>c.charCodeAt(0))) }
  catch { return '' }
})
const result = computed(() => { try { return { data: resolveGantt(parseGantt(source.value)), error: '' } } catch (e) { return { data: null, error: (e as Error).message } } })
const data = computed(() => result.value.data)
const msToIso = (ms: number) => new Date(ms).toISOString().slice(0,10)
const monthStart = (ms: number) => { const d = new Date(ms); return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1) }
const weekStart = (ms: number) => ms - ((new Date(ms).getUTCDay()+6)%7)*DAY
const scale = computed(() => props.scale && props.scale !== 'auto' ? props.scale : (data.value && (data.value.max-data.value.min)/DAY > 110 ? 'month' : 'week'))
const min = computed(() => data.value ? (scale.value === 'month' ? monthStart(data.value.min) : weekStart(data.value.min)) : 0)
const max = computed(() => { if (!data.value) return 1; const d = new Date(data.value.max); return scale.value === 'month' ? Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1) : weekStart(data.value.max)+7*DAY })
const total = computed(() => max.value - min.value)
const pct = (ms:number) => (ms-min.value)/total.value*100
const ticks = computed(() => { const out:{date:number,label:string,left:number}[]=[]; if(!data.value) return out; let at=min.value; while(at<max.value && out.length<80) { const d=new Date(at); out.push({date:at,label:scale.value==='month'?`${d.getUTCMonth()+1}月`:`${d.getUTCMonth()+1}/${d.getUTCDate()}`,left:pct(at)}); at=scale.value==='month'?Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1):at+7*DAY } return out })
const groups = computed(() => data.value?.sections.map((name,i)=>({ name, index:i, tasks:data.value!.tasks.filter(t=>t.section===name) })) ?? [])
const taskStyle = (t:Task) => ({ left:`${pct(t.start)}%`,width:`${Math.max(0.25,pct(t.end)-pct(t.start))}%` })
</script>
<template>
  <FitBox align="start">
    <div class="slide-gantt" :class="`variant-${props.variant || 'bar'}`">
      <div v-if="result.error" class="gantt-error">Gantt構文エラー: {{ result.error }}</div>
      <template v-else-if="data">
        <div v-if="data.title" class="gantt-title">{{ data.title }}</div>
        <div class="gantt-header gantt-row">
          <div class="gantt-label">工程・タスク</div>
          <div class="gantt-time gantt-header-time">
            <div v-for="tick in ticks" :key="tick.date" class="gantt-tick-label" :style="{left:`${tick.left}%`}">{{ tick.label }}</div>
          </div>
        </div>
        <template v-for="group in groups" :key="group.name">
          <div class="gantt-section-row" :class="`zone-${group.index%4}`">{{ group.name }}</div>
          <div v-for="task in group.tasks" :key="task.id" class="gantt-row gantt-task-row">
            <div class="gantt-label gantt-task-label" :title="task.label">{{ task.label }}</div>
            <div class="gantt-time">
              <span v-for="tick in ticks" :key="tick.date" class="gantt-gridline" :style="{left:`${tick.left}%`}" />
              <span v-if="task.milestone" class="gantt-milestone" :style="{left:`${pct(task.start)}%`}" :title="`${task.label}: ${msToIso(task.start)}`" />
              <span v-else class="gantt-bar" :class="[`status-${task.status}`,`bar-zone-${group.index%4}`]" :style="taskStyle(task)" :title="`${task.label}: ${msToIso(task.start)} - ${msToIso(task.end-DAY)}`" />
            </div>
          </div>
        </template>
      </template>
    </div>
  </FitBox>
</template>

<style scoped>
.slide-gantt {
  --gantt-label-width: 215px;
  --gantt-row-height: 31px;
  --gantt-grid: var(--theme-line, #d8e0e8);
  --gantt-text: var(--theme-ink, #3e5265);
  --gantt-muted: var(--theme-muted, #536678);
  --gantt-header: var(--theme-soft, #f2f5f8);
  --gantt-accent: var(--theme-accent, #005c97);
  font-family: var(--theme-font, Arial, 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif);
  color: var(--gantt-text);
  width: 100%;
  font-size: 15px;
  line-height: 1.2;
  background: var(--theme-bg, #fff);
}
.slide-gantt * { box-sizing: border-box; }
.slide-gantt .gantt-title { font-size: 19px; font-weight: 700; margin-bottom: 12px; }
.slide-gantt .gantt-row { display: grid; grid-template-columns: var(--gantt-label-width) minmax(0, 1fr); }
.slide-gantt .gantt-header { height: 43px; background: var(--gantt-header); font-weight: 700; border-bottom: 1px solid var(--theme-line, #b9c7d3); }
.slide-gantt .gantt-label { padding: 10px 12px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; border-right: 1px solid var(--theme-line, #bcc8d4); }
.slide-gantt .gantt-header-time,
.slide-gantt .gantt-time { position: relative; min-width: 0; overflow: hidden; }
.slide-gantt .gantt-tick-label { position: absolute; top: 13px; transform: translateX(6px); font-size: 12px; white-space: nowrap; color: var(--gantt-muted); }
.slide-gantt .gantt-section-row { height: 29px; display: flex; align-items: center; padding: 0 12px; font-size: 14px; font-weight: 700; }
.slide-gantt .zone-0 { background: var(--theme-zone-0-bg, #e8f1fb); color: var(--theme-zone-0-ink, #24578b); }
.slide-gantt .zone-1 { background: var(--theme-zone-1-bg, #eaf4e7); color: var(--theme-zone-1-ink, #287343); }
.slide-gantt .zone-2 { background: var(--theme-zone-2-bg, #fff3d9); color: var(--theme-zone-2-ink, #8a651f); }
.slide-gantt .zone-3 { background: var(--theme-zone-3-bg, #fbe9eb); color: var(--theme-zone-3-ink, #924351); }
.slide-gantt .gantt-task-row { height: var(--gantt-row-height); border-bottom: 1px solid var(--gantt-grid); }
.slide-gantt .gantt-task-label { padding: 7px 12px 7px 22px; font-size: 14px; }
.slide-gantt .gantt-gridline { position: absolute; top: 0; bottom: 0; border-left: 1px solid var(--theme-gantt-grid, #e3e8ee); pointer-events: none; }
.slide-gantt .gantt-bar { position: absolute; top: 50%; transform: translateY(-50%); height: 13px; border-radius: 2px; background: var(--theme-bar-0, #5688b8); min-width: 2px; }
.slide-gantt .bar-zone-1 { background: var(--theme-bar-1, #599b72); }
.slide-gantt .bar-zone-2 { background: var(--theme-bar-2, #d3a146); }
.slide-gantt .bar-zone-3 { background: var(--theme-bar-3, #c87783); }
.slide-gantt .status-done { opacity: .52; }
.slide-gantt .status-active { outline: 2px solid var(--gantt-accent); outline-offset: 1px; }
.slide-gantt .status-crit { background: var(--theme-bar-crit, #c85b5b); }
.slide-gantt .gantt-milestone { position: absolute; top: 50%; width: 12px; height: 12px; transform: translate(-50%, -50%) rotate(45deg); background: var(--theme-bar-milestone, #bb7845); border: 1px solid var(--theme-bg, #fff); }
.slide-gantt.variant-line .gantt-bar { height: 4px; border-radius: 2px; }
.slide-gantt .gantt-error { padding: 18px; color: var(--theme-error-ink, #a52424); background: var(--theme-error-bg, #fff0f0); border: 1px solid var(--theme-error-line, #e5aaaa); border-radius: 5px; font-size: 15px; }
</style>
