import type { TileSizePreset } from '../config/types'

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
  /** Inset from content box to first app column (diagram: 8px). */
  gridInsetX: number
  /** Inset from content box top to first app row (diagram: 16px). */
  gridInsetY: number
  headerHeight: number
}

export interface PaneMetrics {
  /** Macro-grid–snapped size (used for layout bookkeeping; may be larger than content). */
  paneWidth: number
  paneHeight: number
  /** Tight border-box size for drawing the pane; matches app grid + header (no macro slack). */
  renderPaneWidth: number
  renderPaneHeight: number
  /** Bounding box of the app grid (includes grid insets). */
  contentWidth: number
  contentHeight: number
  gridSpanX: number
  gridSpanY: number
  /** Unused (kept for API stability); horizontal fill uses distributed column gaps. */
  alignPadX: number
  /** Slack when snapped paneHeight exceeds natural height (not drawn when using renderPane*). */
  alignPadBottom: number
}

const paneGap = 8
const tileGap = 8
const gridInsetX = 8
const gridInsetY = 16
const headerHeight = 36

/** Horizontal / vertical macro cell sizes so typical panes snap with small slack. */
const paneCellWidthByPreset: Record<TileSizePreset, number> = {
  small: 176,
  medium: 200,
  large: 224,
}

const paneCellHeightByPreset: Record<TileSizePreset, number> = {
  small: 112,
  medium: 124,
  large: 136,
}

const tileSizeByPreset: Record<TileSizePreset, number> = {
  small: 48,
  medium: 56,
  large: 64,
}

/** Space below icon for label (11px text, up to 2 lines). */
const labelBandByPreset: Record<TileSizePreset, number> = {
  small: 22,
  medium: 24,
  large: 26,
}

const iconLabelGapPx = 4

export function getLayoutTokens(size: TileSizePreset): LayoutTokens {
  const tileSize = tileSizeByPreset[size]
  const labelBandHeight = labelBandByPreset[size]
  return {
    paneCellWidth: paneCellWidthByPreset[size],
    paneCellHeight: paneCellHeightByPreset[size],
    paneGap,
    tileSize,
    tileGap,
    appCellHeight: tileSize + iconLabelGapPx + labelBandHeight,
    iconLabelGap: iconLabelGapPx,
    labelBandHeight,
    gridInsetX,
    gridInsetY,
    headerHeight,
  }
}

/** Distance between pane anchors on the dashboard grid. */
export function getPanePlacementSteps(tokens: LayoutTokens): { stepX: number; stepY: number } {
  return {
    stepX: tokens.paneCellWidth + tokens.paneGap,
    stepY: tokens.paneCellHeight + tokens.paneGap,
  }
}

export function getAppColPitch(tokens: LayoutTokens): number {
  return tokens.tileSize + tokens.tileGap
}

/** Width inside the pane for the app matrix (between side insets). */
export function getPaneInnerContentWidth(paneWidth: number, tokens: LayoutTokens): number {
  return Math.max(0, paneWidth - 2 * tokens.gridInsetX)
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

  const gridSpanX = Math.max(1, Math.ceil(naturalPaneWidth / tokens.paneCellWidth))
  const gridSpanY = Math.max(1, Math.ceil(naturalPaneHeight / tokens.paneCellHeight))

  const paneWidth =
    gridSpanX * tokens.paneCellWidth + (gridSpanX - 1) * tokens.paneGap
  const paneHeight =
    gridSpanY * tokens.paneCellHeight + (gridSpanY - 1) * tokens.paneGap

  const alignPadX = 0
  const alignPadBottom = paneHeight - naturalPaneHeight

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
