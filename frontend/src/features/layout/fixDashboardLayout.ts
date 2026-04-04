import type { DashboardConfig, PaneItem, TileSizePreset } from '../config/types'
import { isValidPanePlacement } from '../interaction/collision'
import { formatCoordPair } from '../../lib/coords'
import { findNextPaneGridPosition } from './placement'
import { buildReflowPresentation } from './reflowPresentation'
import { getAppColPitch } from './paneMath'

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
 * 2) Repack pane **top-left** on the **app tile canvas** (same steps as in-pane column/row pitch):
 *    search along `tileStepX` horizontally; `paneWidth + paneGap` between placed panes; row advance
 *    uses `rowMaxHeight + paneGap`.
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
  const gap = tokens.paneGap
  const tileStepX = getAppColPitch(tokens)
  const { rows } = presentation

  const beforeSig = paneLayoutSignature(config.panes)

  const placed: PaneItem[] = []
  let cursorY = 0

  for (const row of rows) {
    let cursorX = 0
    let rowMaxH = 0

    for (const entry of row) {
      const m = entry.metrics
      rowMaxH = Math.max(rowMaxH, m.paneHeight)

      let placedThis = false
      for (let attempt = 0; attempt < 120; attempt++) {
        const x = cursorX + attempt * tileStepX
        const y = cursorY
        const panesWith = [...placed, { ...entry.pane, position: formatCoordPair(x, y) }]
        if (
          isValidPanePlacement({
            panes: panesWith,
            appSize: tilePreset,
            paneId: entry.pane.id,
            x,
            y,
            maxContentWidthPx: w,
          })
        ) {
          placed.push({ ...entry.pane, position: formatCoordPair(x, y) })
          cursorX = x + m.paneWidth + gap
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
        const m2 = entry.metrics
        cursorX = pos.x + m2.paneWidth + gap
      }
    }

    cursorY += rowMaxH + gap
  }

  const byId = new Map(placed.map((p) => [p.id, p]))
  const panesInOriginalOrder = config.panes.map((p) => byId.get(p.id)!).filter(Boolean)

  const next: DashboardConfig = { ...config, panes: panesInOriginalOrder }
  const changed = paneLayoutSignature(next.panes) !== beforeSig

  return { config: next, changed }
}
