import type { PaneItem, TileSizePreset } from '../config/types'
import { getLayoutTokens, getPaneMetrics } from '../layout/paneMath'
import { parseCoordPair } from '../../lib/coords'

type PixelRect = { left: number; top: number; right: number; bottom: number }

function intersectsPixels(a: PixelRect, b: PixelRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

/** Expand rect outward by `margin` on each side (minimum gap between originals = 2*margin when touching inflated edges). */
function expandRect(r: PixelRect, margin: number): PixelRect {
  return {
    left: r.left - margin,
    top: r.top - margin,
    right: r.right + margin,
    bottom: r.bottom + margin,
  }
}

function panePixelRect(
  pane: PaneItem,
  appSize: TileSizePreset,
  override?: { x?: number; y?: number; appColumns?: number; appRows?: number },
): PixelRect {
  const tokens = getLayoutTokens(appSize)
  const [left0, top0] = parseCoordPair(pane.position)
  const left = override?.x ?? left0
  const top = override?.y ?? top0

  const appColumns = override?.appColumns ?? pane.appColumns
  const appRows = override?.appRows ?? pane.appRows
  const m = getPaneMetrics(appColumns, appRows, tokens)

  return {
    left,
    top,
    right: left + m.paneWidth,
    bottom: top + m.paneHeight,
  }
}

export function isValidPanePlacement(params: {
  panes: PaneItem[]
  appSize: TileSizePreset
  paneId: string
  x?: number
  y?: number
  appColumns?: number
  appRows?: number
  /** Measured dashboard canvas content width; pane **footprint** must not extend past this. */
  maxContentWidthPx?: number
}): boolean {
  const moving = params.panes.find((p) => p.id === params.paneId)
  if (!moving) return false

  const movingRect = panePixelRect(moving, params.appSize, {
    x: params.x,
    y: params.y,
    appColumns: params.appColumns,
    appRows: params.appRows,
  })

  if (
    params.maxContentWidthPx !== undefined &&
    Number.isFinite(params.maxContentWidthPx) &&
    params.maxContentWidthPx > 0
  ) {
    if (movingRect.left < -0.5) return false
    if (movingRect.right > params.maxContentWidthPx + 0.5) return false
  }

  const tokens = getLayoutTokens(params.appSize)
  const margin = tokens.paneGap / 2
  const movingExpanded = expandRect(movingRect, margin)

  return params.panes
    .filter((p) => p.id !== params.paneId)
    .every((pane) => {
      const rect = panePixelRect(pane, params.appSize)
      const otherExpanded = expandRect(rect, margin)
      return !intersectsPixels(movingExpanded, otherExpanded)
    })
}
