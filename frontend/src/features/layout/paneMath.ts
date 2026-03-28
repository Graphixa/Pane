import type { TileSizePreset } from '../config/types'

export interface LayoutTokens {
  paneCellSize: number
  paneGap: number
  tileSize: number
  tileGap: number
  panePaddingLeft: number
  panePaddingRight: number
  panePaddingTop: number
  panePaddingBottom: number
  headerHeight: number
}

export interface PaneMetrics {
  paneWidth: number
  paneHeight: number
  contentWidth: number
  contentHeight: number
  gridSpanX: number
  gridSpanY: number
  contentLeftInset: number
  contentTopInset: number
}

const paneGap = 8
const tileGap = 18

const panePaddingLeft = 16
const panePaddingRight = 16
const panePaddingTop = 18
const panePaddingBottom = 18

const headerHeight = 36

export function getLayoutTokens(size: TileSizePreset): LayoutTokens {
  // Outer dashboard grid cell scales with tile preset (tile × 3 keeps span math stable).
  const paneCellSizeByPreset: Record<TileSizePreset, number> = {
    small: 144,
    medium: 168,
    large: 192,
  }

  const tileSizeByPreset: Record<TileSizePreset, number> = {
    small: 48,
    medium: 56,
    large: 64,
  }

  return {
    paneCellSize: paneCellSizeByPreset[size],
    paneGap,
    tileSize: tileSizeByPreset[size],
    tileGap,
    panePaddingLeft,
    panePaddingRight,
    panePaddingTop,
    panePaddingBottom,
    headerHeight,
  }
}

export function getPaneMetrics(
  appColumns: number,
  appRows: number,
  tokens: LayoutTokens,
): PaneMetrics {
  const contentWidth =
    appColumns * tokens.tileSize + (appColumns - 1) * tokens.tileGap
  const contentHeight =
    appRows * tokens.tileSize + (appRows - 1) * tokens.tileGap

  const paneWidth =
    tokens.panePaddingLeft + contentWidth + tokens.panePaddingRight
  const paneHeight =
    tokens.headerHeight +
    tokens.panePaddingTop +
    contentHeight +
    tokens.panePaddingBottom

  const gridSpanX = Math.ceil(paneWidth / tokens.paneCellSize)
  const gridSpanY = Math.ceil(paneHeight / tokens.paneCellSize)

  return {
    paneWidth,
    paneHeight,
    contentWidth,
    contentHeight,
    gridSpanX,
    gridSpanY,
    contentLeftInset: tokens.panePaddingLeft,
    contentTopInset: tokens.headerHeight + tokens.panePaddingTop,
  }
}

export function getAppRenderPosition(
  col: number,
  row: number,
  tokens: LayoutTokens,
  paneLeft: number,
  paneTop: number,
): { x: number; y: number } {
  const contentLeft = paneLeft + tokens.panePaddingLeft
  const contentTop = paneTop + tokens.headerHeight + tokens.panePaddingTop

  return {
    x: contentLeft + col * (tokens.tileSize + tokens.tileGap),
    y: contentTop + row * (tokens.tileSize + tokens.tileGap),
  }
}

