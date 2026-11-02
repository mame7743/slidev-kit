import { defineMermaidSetup } from '@slidev/types'
import { getKitThemeConfig } from '../composables/useKitContext.mjs'
import { isKitPreset, normalizeKitPreset } from '../lib/kit-presets.mjs'
import '../designs/corporate/tokens.css'
import '../designs/editorial/tokens.css'

export default defineMermaidSetup(() => {
  const preset = getKitThemeConfig().variant
  if (!isKitPreset(preset)) return {}
  // Mermaid renders inside a shadow root, so outside CSS cannot theme its SVG.
  // Read the same semantic tokens used by the slide rather than duplicating colors.
  const probe = document.createElement('div')
  probe.className = 'kit-slide'
  probe.dataset.design = normalizeKitPreset(preset)
  probe.hidden = true
  document.body.append(probe)
  const style = getComputedStyle(probe)
  const token = (name: string) => style.getPropertyValue(`--kit-${name}`).trim()
  const themeVariables = {
    primaryColor: token('surface'), primaryTextColor: token('text'),
    primaryBorderColor: token('primary'), lineColor: token('accent'),
    fontFamily: token('font'),
    xyChart: {
      backgroundColor: token('background'),
      plotColorPalette: `${token('chart-1')},${token('chart-2')}`,
      xAxisLabelColor: token('text'), yAxisLabelColor: token('text'),
    },
  }
  probe.remove()
  return {
    theme: 'base', themeVariables,
    xyChart: {
      width: 900, height: 340, useMaxWidth: false,
      xAxis: { labelFontSize: 20, titleFontSize: 20 },
      yAxis: { labelFontSize: 20, titleFontSize: 20 },
    },
  }
})
