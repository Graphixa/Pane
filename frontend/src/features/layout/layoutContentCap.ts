import type { DashboardConfig } from '../config/types'
import { needsDashboardReflow } from './reflowPresentation'
import { getEffectiveTileSizeForCanvasWidth } from './viewportLayout'

/** Pixel cap from layout settings; `null` when width mode is full (no configured cap). */
export function layoutContentCapPx(config: DashboardConfig): number | null {
  if (config.layout.widthMode === 'full') return null
  if (config.layout.widthMode === 'custom') return config.layout.customWidth ?? 1200
  return config.layout.maxWidth ?? 1200
}

/**
 * Saving `nextConfig` would narrow (or introduce) a layout cap and the current pane positions
 * do not fit that cap — caller should repack panes to match view-style reflow.
 */
export function shouldReorganizePanesForNarrowerLayout(
  prevConfig: DashboardConfig,
  nextConfig: DashboardConfig,
): boolean {
  const nextCap = layoutContentCapPx(nextConfig)
  if (nextCap === null) return false

  const prevCap = layoutContentCapPx(prevConfig)
  if (prevCap !== null && nextCap >= prevCap) return false

  const eff = getEffectiveTileSizeForCanvasWidth(nextCap, nextConfig.appLayout.size)
  return needsDashboardReflow(nextConfig, nextCap, eff)
}
