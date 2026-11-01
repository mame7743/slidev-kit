export type Status = 'normal' | 'done' | 'active' | 'crit'
export interface TaskSpec { id: string; label: string; section: string; status: Status; milestone: boolean; startToken: string; endToken: string; line: number }
export interface GanttSpec { title: string; dateFormat: string; axisFormat: string; tickInterval: string; excludes: string[]; tasks: TaskSpec[]; sections: string[] }
export interface Task extends Omit<TaskSpec, 'startToken'|'endToken'> { start: number; end: number }
export interface GanttData { title: string; tasks: Task[]; sections: string[]; min: number; max: number; tickInterval: string; axisFormat: string }
