import type { TileSizePreset } from '../config/types'

/** Canvas width below which we render with `small` tokens (non-persisted). */
export const NARROW_CANVAS_WIDTH_PX = 720

/**
 * Tile preset used for layout math on screen: matches `DashboardGrid` so placement
 * and collision agree when the canvas is narrow.
 */
export function getEffectiveTileSizeForCanvasWidth(
  canvasContentWidth: number | undefined,
  configuredSize: TileSizePreset,
): TileSizePreset {
  if (canvasContentWidth === undefined || canvasContentWidth <= 0) return configuredSize
  return canvasContentWidth < NARROW_CANVAS_WIDTH_PX ? 'small' : configuredSize
}
