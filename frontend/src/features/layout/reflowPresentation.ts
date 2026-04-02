import type { DashboardConfig, PaneItem, TileSizePreset } from '../config/types'
import { remapAppPositionsForGridResize } from '../apps/appMath'
import { parseCoordPair } from '../../lib/coords'
import {
  getLayoutTokens,
  getPaneMetrics,
  getPanePlacementSteps,
  type LayoutTokens,
} from './paneMath'
import { computeReflowRows, sortPanesForReflow, type PaneLayoutEntry } from './reflowLayout'

/**
 * Shrink app columns (and grow rows) until the pane’s render width fits `maxRenderWidthPx`,
 * preserving app order via row-major remap (same as manual resize).
 */
export function fitPaneAppGridToMaxWidth(
  pane: PaneItem,
  tokens: LayoutTokens,
  maxRenderWidthPx: number,
): PaneItem {
  const n = pane.apps.length
  const startCols = Math.max(1, pane.appColumns)

  for (let cols = startCols; cols >= 1; cols--) {
    const rows = Math.max(1, Math.ceil(Math.max(n, 1) / cols))
    const m = getPaneMetrics(cols, rows, tokens)
    if (m.renderPaneWidth <= maxRenderWidthPx && cols * rows >= n) {
      const appsUnchanged =
        cols === pane.appColumns && rows === pane.appRows
          ? pane.apps
          : remapAppPositionsForGridResize(pane.apps, pane.appColumns, cols, rows)
      return { ...pane, appColumns: cols, appRows: rows, apps: appsUnchanged }
    }
  }

  const rows = Math.max(1, n)
  return {
    ...pane,
    appColumns: 1,
    appRows: rows,
    apps: remapAppPositionsForGridResize(pane.apps, pane.appColumns, 1, rows),
  }
}

export function getPaneOriginForTokens(pane: PaneItem, tokens: LayoutTokens): {
  paneLeft: number
  paneTop: number
} {
  const [x, y] = parseCoordPair(pane.position)
  const { stepX, stepY } = getPanePlacementSteps(tokens)
  return { paneLeft: x * stepX, paneTop: y * stepY }
}

/**
 * Logical dashboard extent from saved grid positions and pane dimensions (no reflow fit).
 * Matches `DashboardGrid` absolute layout when not in drag/resize preview.
 */
export function computeDashboardContentExtent(
  config: DashboardConfig,
  tokens: LayoutTokens,
): { width: number; height: number } {
  let width = 0
  let height = 0
  for (const pane of config.panes) {
    const { paneLeft, paneTop } = getPaneOriginForTokens(pane, tokens)
    const metrics = getPaneMetrics(pane.appColumns, pane.appRows, tokens)
    width = Math.max(width, paneLeft + metrics.renderPaneWidth)
    height = Math.max(height, paneTop + metrics.renderPaneHeight)
  }
  return { width, height }
}

export function needsDashboardReflow(
  config: DashboardConfig,
  containerContentWidth: number | undefined,
  tilePreset: TileSizePreset,
): boolean {
  if (containerContentWidth === undefined || containerContentWidth <= 0) return false
  const tokens = getLayoutTokens(tilePreset)
  const { width } = computeDashboardContentExtent(config, tokens)
  return width > containerContentWidth
}

export type ReflowPresentation = {
  tokens: LayoutTokens
  tilePreset: TileSizePreset
  rows: PaneLayoutEntry[][]
  contentWidth: number
  contentHeight: number
}

/**
 * Fit panes to canvas width, then wrap rows — same algorithm as `fixDashboardLayout` before grid placement.
 */
export function buildReflowPresentation(
  config: DashboardConfig,
  containerContentWidthPx: number,
  tilePreset: TileSizePreset,
  opts?: { readingOrderIds?: string[] },
): ReflowPresentation | null {
  const w = Math.floor(containerContentWidthPx)
  if (!Number.isFinite(w) || w <= 0) return null

  const tokens = getLayoutTokens(tilePreset)
  const maxPanePx = w

  const entriesForSort: PaneLayoutEntry[] = config.panes.map((pane) => ({
    pane,
    metrics: getPaneMetrics(pane.appColumns, pane.appRows, tokens),
  }))

  let readingOrder: PaneItem[]
  if (opts?.readingOrderIds?.length) {
    const byId = new Map(entriesForSort.map((e) => [e.pane.id, e.pane] as const))
    const picked = opts.readingOrderIds.map((id) => byId.get(id)).filter(Boolean) as PaneItem[]
    const pickedSet = new Set(picked.map((p) => p.id))
    const rest = sortPanesForReflow(entriesForSort)
      .map((e) => e.pane)
      .filter((p) => !pickedSet.has(p.id))
    readingOrder = [...picked, ...rest]
  } else {
    readingOrder = sortPanesForReflow(entriesForSort).map((e) => e.pane)
  }

  const reshaped = readingOrder.map((p) => fitPaneAppGridToMaxWidth(p, tokens, maxPanePx))

  const layoutEntries: PaneLayoutEntry[] = reshaped.map((pane) => ({
    pane,
    metrics: getPaneMetrics(pane.appColumns, pane.appRows, tokens),
  }))
  const { rows, contentWidth, contentHeight } = computeReflowRows(
    layoutEntries,
    maxPanePx,
    tokens.paneGap,
  )

  return { tokens, tilePreset, rows, contentWidth, contentHeight }
}
