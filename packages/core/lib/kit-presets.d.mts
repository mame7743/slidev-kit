export type KitPreset = 'corporate' | 'editorial'
export const kitPresets: readonly KitPreset[]
export function isKitPreset(value: unknown): value is KitPreset
export function normalizeKitPreset(value: unknown): KitPreset
