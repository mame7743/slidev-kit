// Theme-level presets, independent of each slide's structural variant.
export const kitPresets = Object.freeze(['corporate', 'editorial'])
export function isKitPreset(value) {
  return kitPresets.includes(value)
}
// The seven KitSlide-only layouts historically used Corporate for any theme.
export function normalizeKitPreset(value) {
  return isKitPreset(value) ? value : 'corporate'
}
