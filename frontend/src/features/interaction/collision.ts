import type { PaneItem, TileSizePreset } from '../config/types'
import { getLayoutTokens, getPaneMetrics } from '../layout/paneMath'
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
}): boolean {
  const moving = params.panes.find((p) => p.id === params.paneId)
  if (!moving) return false

  const movingRect = paneRectFromPane(moving, params.appSize, {
    x: params.x,
    y: params.y,
    appColumns: params.appColumns,
    appRows: params.appRows,
  })

  return params.panes
    .filter((p) => p.id !== params.paneId)
    .every((pane) => {
      const rect = paneRectFromPane(pane, params.appSize)
      return !intersects(movingRect, rect)
    })
}

