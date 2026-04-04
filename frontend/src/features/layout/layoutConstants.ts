import type { TileSizePreset } from '../config/types'

/**
 * Single source of truth for dashboard layout pixel constants.
 * All pane/grid math should derive from these values — do not duplicate literals elsewhere.
 */

export const PANE_GAP_PX = 8
/** Gutter between app tile columns/rows (matches pane title horizontal padding rhythm at 1rem root). */
export const TILE_GAP_PX = 10
/** Horizontal inset from pane edge to app grid; matches header `px-3` (0.75rem ≈ 12px at 16px root). */
export const GRID_INSET_X_PX = 12
export const GRID_INSET_Y_PX = 16
export const HEADER_HEIGHT_PX = 36
export const ICON_LABEL_GAP_PX = 4

export const TILE_SIZE_BY_PRESET: Record<TileSizePreset, number> = {
  small: 48,
  medium: 56,
  large: 64,
}

/** Horizontal macro cell width (placement + collision spans). Natural width of a 3-column pane. */
export const PANE_CELL_WIDTH_BY_PRESET: Record<TileSizePreset, number> = {
  small: 2 * GRID_INSET_X_PX + 3 * TILE_SIZE_BY_PRESET.small + 2 * TILE_GAP_PX,
  medium: 2 * GRID_INSET_X_PX + 3 * TILE_SIZE_BY_PRESET.medium + 2 * TILE_GAP_PX,
  large: 2 * GRID_INSET_X_PX + 3 * TILE_SIZE_BY_PRESET.large + 2 * TILE_GAP_PX,
}

/** Space below icon for label (up to two lines). */
export const LABEL_BAND_HEIGHT_BY_PRESET: Record<TileSizePreset, number> = {
  small: 22,
  medium: 24,
  large: 26,
}

/**
 * Vertical macro cell height (legacy naming / reflow heuristics). Matches a **single-row** pane’s
 * natural outer height (`HEADER + 2*GRID_INSET_Y + one app cell`).
 *
 * Derived from shared constants — do not hand-tune literals here.
 */
export const PANE_CELL_HEIGHT_BY_PRESET: Record<TileSizePreset, number> = {
  small:
    HEADER_HEIGHT_PX +
    2 * GRID_INSET_Y_PX +
    TILE_SIZE_BY_PRESET.small +
    ICON_LABEL_GAP_PX +
    LABEL_BAND_HEIGHT_BY_PRESET.small,
  medium:
    HEADER_HEIGHT_PX +
    2 * GRID_INSET_Y_PX +
    TILE_SIZE_BY_PRESET.medium +
    ICON_LABEL_GAP_PX +
    LABEL_BAND_HEIGHT_BY_PRESET.medium,
  large:
    HEADER_HEIGHT_PX +
    2 * GRID_INSET_Y_PX +
    TILE_SIZE_BY_PRESET.large +
    ICON_LABEL_GAP_PX +
    LABEL_BAND_HEIGHT_BY_PRESET.large,
}
