import type { PaneItem, TileSizePreset } from '../config/types'
import { getLayoutTokens, getPaneMetrics, getPanePlacementSteps } from '../layout/paneMath'
import { parseCoordPair } from '../../lib/coords'

interface PaneRect {
  x: number
  y: number
  spanX: number
  spanY: number
}

function intersects(a: PaneRect, b: PaneRect): boolean {
  return (
    a.x < b.x + b.spanX &&
    a.x + a.spanX > b.x &&
    a.y < b.y + b.spanY &&
    a.y + a.spanY > b.y
  )
}

function paneRectFromPane(
  pane: PaneItem,
  appSize: TileSizePreset,
  override?: { x?: number; y?: number; appColumns?: number; appRows?: number },
): PaneRect {
  const [x, y] = parseCoordPair(pane.position)
  const tokens = getLayoutTokens(appSize)
  const appColumns = override?.appColumns ?? pane.appColumns
  const appRows = override?.appRows ?? pane.appRows
  const m = getPaneMetrics(appColumns, appRows, tokens)

  return {
    x: override?.x ?? x,
    y: override?.y ?? y,
    spanX: m.gridSpanX,
    spanY: m.gridSpanY,
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
  /** Measured dashboard canvas content width; pane render box must not extend past this. */
  maxContentWidthPx?: number
}): boolean {
  const moving = params.panes.find((p) => p.id === params.paneId)
  if (!moving) return false

  const movingRect = paneRectFromPane(moving, params.appSize, {
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
    const [gx0] = parseCoordPair(moving.position)
    const gx = params.x ?? gx0
    const appColumns = params.appColumns ?? moving.appColumns
    const appRows = params.appRows ?? moving.appRows
    const tokens = getLayoutTokens(params.appSize)
    const { stepX } = getPanePlacementSteps(tokens)
    const m = getPaneMetrics(appColumns, appRows, tokens)
    const paneLeft = gx * stepX
    if (paneLeft < -0.5) return false
    if (paneLeft + m.renderPaneWidth > params.maxContentWidthPx + 0.5) return false
  }

  return params.panes
    .filter((p) => p.id !== params.paneId)
    .every((pane) => {
      const rect = paneRectFromPane(pane, params.appSize)
      return !intersects(movingRect, rect)
    })
}

