import type { TileSizePreset } from '../config/types'
import { parseCoordPair } from '../../lib/coords'
import {
  GRID_INSET_X_PX,
  GRID_INSET_Y_PX,
  HEADER_HEIGHT_PX,
  ICON_LABEL_GAP_PX,
  LABEL_BAND_HEIGHT_BY_PRESET,
  PANE_CELL_HEIGHT_BY_PRESET,
  PANE_CELL_WIDTH_BY_PRESET,
  PANE_GAP_PX,
  TILE_GAP_PX,
  TILE_SIZE_BY_PRESET,
} from './layoutConstants'

/**
 * Dashboard layout: all pixel tokens and formulas live in `./layoutConstants` + this module.
 * Do not scatter magic numbers in UI components — use `getLayoutTokens` / `getPaneMetrics`.
 */

export interface LayoutTokens {
  /** Horizontal macro-grid unit for pane placement & collision span. */
  paneCellWidth: number
  /** Vertical macro-grid unit for pane placement & collision span. */
  paneCellHeight: number
  paneGap: number
  /** Icon width; column pitch uses this + tileGap. */
  tileSize: number
  /** Gutter between app cells (horizontal & vertical), per layout diagram. */
  tileGap: number
  /** Vertical space one app row occupies (icon + gap + label band below icon). */
  appCellHeight: number
  /** Pixels between icon box bottom and label text. */
  iconLabelGap: number
  /** Reserved height for label under icon (outside icon border). */
  labelBandHeight: number
  /** Inset from content box to first app column (matches header padding, 12px at default scale). */
  gridInsetX: number
  /** Inset from content box top to first app row (diagram: 16px). */
  gridInsetY: number
  headerHeight: number
}

/**
 * Pane layout metrics: **outer box** matches the tight header + app matrix; **gridSpan** is how
 * many tile-canvas steps ({@link getAppColPitch} / {@link getAppRowPitch}) that box occupies for
 * packing (`fixDashboardLayout`) and cursor advance — it may be larger than natural width/height
 * in “step” units without adding empty pixels on the card.
 */
export interface PaneMetrics {
  /** Outer border-box width/height (no snapped slack band). */
  paneWidth: number
  paneHeight: number
  /** Same as `paneWidth` / `paneHeight` (kept for call sites that distinguish “render” vs span). */
  renderPaneWidth: number
  renderPaneHeight: number
  /** Bounding box of the app grid (includes grid insets). */
  contentWidth: number
  contentHeight: number
  /** Width/height of this pane in **tile-canvas** cells (same steps as dashboard placement). */
  gridSpanX: number
  gridSpanY: number
  /** Unused (kept for API stability). */
  alignPadX: number
  /** Always 0: outer height is tight to content (no snapped vertical slack band). */
  alignPadBottom: number
}

export function getLayoutTokens(size: TileSizePreset): LayoutTokens {
  const tileSize = TILE_SIZE_BY_PRESET[size]
  const labelBandHeight = LABEL_BAND_HEIGHT_BY_PRESET[size]
  return {
    paneCellWidth: PANE_CELL_WIDTH_BY_PRESET[size],
    paneCellHeight: PANE_CELL_HEIGHT_BY_PRESET[size],
    paneGap: PANE_GAP_PX,
    tileSize,
    tileGap: TILE_GAP_PX,
    appCellHeight: tileSize + ICON_LABEL_GAP_PX + labelBandHeight,
    iconLabelGap: ICON_LABEL_GAP_PX,
    labelBandHeight,
    gridInsetX: GRID_INSET_X_PX,
    gridInsetY: GRID_INSET_Y_PX,
    headerHeight: HEADER_HEIGHT_PX,
  }
}

/** Edit overlay + pane placement: tile pitch and in-pane content phase (from `LayoutTokens` only). */
export function getDashboardCanvasGridSpec(tokens: LayoutTokens): {
  tileStepX: number
  tileStepY: number
  contentOriginX: number
  contentOriginY: number
} {
  return {
    tileStepX: getAppColPitch(tokens),
    tileStepY: getAppRowPitch(tokens),
    contentOriginX: tokens.gridInsetX,
    contentOriginY: tokens.headerHeight + tokens.gridInsetY,
  }
}

/** Pixel top-left from stored `pane.position` as `"leftPx,topPx"`. */
export function getPaneCanvasOriginPixels(
  pane: { position: string },
  _tokens: LayoutTokens,
): { paneLeft: number; paneTop: number } {
  const [leftPx, topPx] = parseCoordPair(pane.position)
  return { paneLeft: leftPx, paneTop: topPx }
}

export function getAppColPitch(tokens: LayoutTokens): number {
  return tokens.tileSize + tokens.tileGap
}

/**
 * Width inside a pane border box (between side insets), given that box’s total width.
 * For **tile column pitch / gutters**, use {@link getPaneInnerTileWidth} so extra macro
 * footprint slack does not stretch `tileGap` (that would look like random huge column gaps).
 */
export function getPaneInnerContentWidth(paneBorderBoxWidth: number, tokens: LayoutTokens): number {
  return Math.max(0, paneBorderBoxWidth - 2 * tokens.gridInsetX)
}

/** Inner width for tile layout; gutters stay `tileGap` (no artificial stretch). */
export function getPaneInnerTileWidth(metrics: PaneMetrics, tokens: LayoutTokens): number {
  return getPaneInnerContentWidth(metrics.renderPaneWidth, tokens)
}

/** Extra horizontal space is spread across column gutters so tiles fill the pane (like spring gaps). */
export function getColumnGapDistributed(
  tokens: LayoutTokens,
  appColumns: number,
  paneInnerWidth: number,
): number {
  if (appColumns <= 1) return tokens.tileGap
  const minContent =
    appColumns * tokens.tileSize + (appColumns - 1) * tokens.tileGap
  const extra = Math.max(0, paneInnerWidth - minContent)
  return tokens.tileGap + extra / (appColumns - 1)
}

export function getAppColPitchDistributed(
  tokens: LayoutTokens,
  appColumns: number,
  paneInnerWidth: number,
): number {
  return tokens.tileSize + getColumnGapDistributed(tokens, appColumns, paneInnerWidth)
}

export function getAppRowPitch(tokens: LayoutTokens): number {
  return tokens.appCellHeight + tokens.tileGap
}

export function getPaneMetrics(
  appColumns: number,
  appRows: number,
  tokens: LayoutTokens,
): PaneMetrics {
  const contentWidth =
    tokens.gridInsetX + appColumns * tokens.tileSize + (appColumns - 1) * tokens.tileGap + tokens.gridInsetX

  const contentHeight =
    tokens.gridInsetY + appRows * tokens.appCellHeight + (appRows - 1) * tokens.tileGap + tokens.gridInsetY

  const naturalPaneWidth = contentWidth
  const naturalPaneHeight = tokens.headerHeight + contentHeight

  const tileStepX = getAppColPitch(tokens)
  const tileStepY = getAppRowPitch(tokens)

  const gridSpanX = Math.max(1, Math.ceil(naturalPaneWidth / tileStepX))
  const gridSpanY = Math.max(1, Math.ceil(naturalPaneHeight / tileStepY))

  const paneWidth = naturalPaneWidth
  const paneHeight = naturalPaneHeight

  const alignPadX = 0
  const alignPadBottom = 0

  return {
    paneWidth,
    paneHeight,
    renderPaneWidth: naturalPaneWidth,
    renderPaneHeight: naturalPaneHeight,
    contentWidth,
    contentHeight,
    gridSpanX,
    gridSpanY,
    alignPadX,
    alignPadBottom,
  }
}

export function getAppRenderPosition(
  col: number,
  row: number,
  tokens: LayoutTokens,
  paneLeft: number,
  paneTop: number,
): { x: number; y: number } {
  const colPitch = getAppColPitch(tokens)
  const rowPitch = getAppRowPitch(tokens)
  const contentLeft = paneLeft + tokens.gridInsetX
  const contentTop = paneTop + tokens.headerHeight + tokens.gridInsetY

  return {
    x: contentLeft + col * colPitch,
    y: contentTop + row * rowPitch,
  }
}
