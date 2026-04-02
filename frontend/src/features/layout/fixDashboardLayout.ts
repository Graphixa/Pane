import type { DashboardConfig, PaneItem, TileSizePreset } from '../config/types'
import { isValidPanePlacement } from '../interaction/collision'
import { formatCoordPair } from '../../lib/coords'
import { findNextPaneGridPosition } from './placement'
import { getPanePlacementSteps } from './paneMath'
import { buildReflowPresentation } from './reflowPresentation'

export { fitPaneAppGridToMaxWidth } from './reflowPresentation'

function paneLayoutSignature(panes: PaneItem[]): string {
  return panes
    .map((p) => {
      const apps = [...p.apps]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((a) => `${a.id}:${a.position}`)
        .join('|')
      return `${p.id}@${p.position};${p.appColumns}x${p.appRows};${apps}`
    })
    .sort()
    .join('\n')
}

/**
 * 1) Fit each pane’s app grid to the measured canvas width (narrower columns → more rows).
 * 2) Repack pane **macro** positions using the same **pixel row wrap** as presentation reflow
 *    (`buildReflowPresentation` / `computeReflowRows`), then assign integer `(x,y)` per row with
 *    collision checks so the persisted grid fits the measured canvas width.
 */
export function fixDashboardLayout(
  config: DashboardConfig,
  containerContentWidthPx: number,
  tilePreset: TileSizePreset,
  opts?: { readingOrderIds?: string[] },
): { config: DashboardConfig; changed: boolean } {
  const w = Math.floor(containerContentWidthPx)
  if (!Number.isFinite(w) || w <= 0) {
    return { config, changed: false }
  }

  const presentation = buildReflowPresentation(config, w, tilePreset, opts)
  if (!presentation) {
    return { config, changed: false }
  }

  const tokens = presentation.tokens
  const { stepX, stepY } = getPanePlacementSteps(tokens)
  const gapCellsX = Math.max(0, Math.ceil(tokens.paneGap / stepX))
  const gapCellsY = Math.max(1, Math.ceil(tokens.paneGap / stepY))
  const { rows } = presentation

  const beforeSig = paneLayoutSignature(config.panes)

  const placed: PaneItem[] = []
  let gridY = 0

  for (const row of rows) {
    let rowSpanY = 1
    let cursorX = 0

    for (const entry of row) {
      const m = entry.metrics
      rowSpanY = Math.max(rowSpanY, m.gridSpanY)

      let placedThis = false
      for (let attempt = 0; attempt < 120; attempt++) {
        const x = cursorX + attempt
        const panesWith = [
          ...placed,
          { ...entry.pane, position: formatCoordPair(x, gridY) },
        ]
        if (
          isValidPanePlacement({
            panes: panesWith,
            appSize: tilePreset,
            paneId: entry.pane.id,
            x,
            y: gridY,
            maxContentWidthPx: w,
          })
        ) {
          placed.push({ ...entry.pane, position: formatCoordPair(x, gridY) })
          cursorX = x + m.gridSpanX + gapCellsX
          placedThis = true
          break
        }
      }

      if (!placedThis) {
        const pos = findNextPaneGridPosition(
          placed,
          tilePreset,
          {
            appColumns: entry.pane.appColumns,
            appRows: entry.pane.appRows,
          },
          { maxContentWidthPx: w },
        )
        placed.push({ ...entry.pane, position: formatCoordPair(pos.x, pos.y) })
        cursorX = pos.x + m.gridSpanX + gapCellsX
      }
    }

    gridY += rowSpanY + gapCellsY
  }

  const byId = new Map(placed.map((p) => [p.id, p]))
  const panesInOriginalOrder = config.panes.map((p) => byId.get(p.id)!).filter(Boolean)

  const next: DashboardConfig = { ...config, panes: panesInOriginalOrder }
  const changed = paneLayoutSignature(next.panes) !== beforeSig

  return { config: next, changed }
}
