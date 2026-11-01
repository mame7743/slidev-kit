export declare const knownProps: Set<string>
export declare function hashString(input: string): string
export declare function canonical(value: unknown): string
export declare function normalizeFigureProps(raw?: Record<string, unknown>): {
  config: Record<string, unknown>
  unknown: string[]
}
export declare function figureHash(raw?: Record<string, unknown>): string
export declare function figureHashFromConfig(config: Record<string, unknown>): string
declare global {
  const __FIG_BUILD_ID__: string | undefined
}
