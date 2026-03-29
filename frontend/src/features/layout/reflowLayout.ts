import type { PaneItem } from '../config/types'
import type { PaneMetrics } from './paneMath'
import { parseCoordPair } from '../../lib/coords'

export type PaneLayoutEntry = {
  pane: PaneItem
  metrics: PaneMetrics
}

/**
 * Reading order: ascending grid Y, then grid X (row-major on logical pane grid).
 */
export function sortPanesForReflow(entries: PaneLayoutEntry[]): PaneLayoutEntry[] {
  return [...entries].sort((a, b) => {
    const [ax, ay] = parseCoordPair(a.pane.position)
    const [bx, by] = parseCoordPair(b.pane.position)
    if (ay !== by) return ay - by
    return ax - bx
  })
}

/**
 * Pack panes into rows that wrap when the next pane would exceed `availableWidth`.
 * Each row is rendered as flex + `justify-center` so short rows stay visually centered
 * (avoids a jagged right edge inside a wide bounding box).
 */
export function computeReflowRows(
  entries: PaneLayoutEntry[],
  availableWidth: number,
  gap: number,
): {
  rows: PaneLayoutEntry[][]
  contentWidth: number
  contentHeight: number
} {
  const order = sortPanesForReflow(entries)
  const rows: PaneLayoutEntry[][] = []
  let currentRow: PaneLayoutEntry[] = []
  let rowX = 0

  for (const entry of order) {
    const w = entry.metrics.renderPaneWidth

    if (currentRow.length > 0 && rowX + gap + w > availableWidth) {
      rows.push(currentRow)
      currentRow = []
      rowX = 0
    }

    currentRow.push(entry)
    rowX += (currentRow.length > 1 ? gap : 0) + w
  }
  if (currentRow.length) rows.push(currentRow)

  let contentWidth = 0
  let contentHeight = 0
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    let rowW = 0
    let rowH = 0
    for (let j = 0; j < row.length; j++) {
      const e = row[j]!
      rowW += (j > 0 ? gap : 0) + e.metrics.renderPaneWidth
      rowH = Math.max(rowH, e.metrics.renderPaneHeight)
    }
    contentWidth = Math.max(contentWidth, rowW)
    contentHeight += (i > 0 ? gap : 0) + rowH
  }

  return { rows, contentWidth, contentHeight }
}

export function maxPaneRenderWidth(entries: PaneLayoutEntry[]): number {
  if (entries.length === 0) return 0
  return Math.max(...entries.map((e) => e.metrics.renderPaneWidth))
}
