import arrangements from './arrangements.json'

/** Placement presets; content and business patterns do not belong here. */
export { arrangements }
export type Arrangement = keyof typeof arrangements

export function resolveArrangement(value: unknown): Arrangement {
  return typeof value === 'string' && Object.hasOwn(arrangements, value)
    ? value as Arrangement : 'single'
}

export function resolveColumns(value: unknown): 2 | 3 | undefined {
  const count = Number(value)
  return count === 2 || count === 3 ? count : undefined
}

export function resolveRatio(value: unknown, fallback: string): string {
  const match = typeof value === 'string' && value.match(/^([1-9]):([1-9])$/)
  return match ? `${match[1]}fr ${match[2]}fr` : fallback
}
