import { describe, expect, it } from 'vitest'

import { PANE_CELL_HEIGHT_BY_PRESET } from '../../features/layout/layoutConstants'
import {
  getAppColPitch,
  getAppColPitchDistributed,
  getAppRenderPosition,
  getAppRowPitch,
  getColumnGapDistributed,
  getDashboardCanvasGridSpec,
  getLayoutTokens,
  getPaneCanvasOriginPixels,
  getPaneInnerContentWidth,
  getPaneInnerTileWidth,
  getPaneMetrics,
} from '../../features/layout/paneMath'

describe('layout/paneMath', () => {
  it('getLayoutTokens returns diagram-aligned preset values', () => {
    expect(getLayoutTokens('small')).toMatchObject({
      paneCellWidth: 188,
      paneCellHeight: PANE_CELL_HEIGHT_BY_PRESET.small,
      paneGap: 8,
      tileSize: 48,
      tileGap: 10,
      iconLabelGap: 4,
      labelBandHeight: 22,
      appCellHeight: 48 + 4 + 22,
      gridInsetX: 12,
      gridInsetY: 16,
      headerHeight: 36,
    })

    expect(getLayoutTokens('medium')).toMatchObject({
      paneCellWidth: 212,
      tileSize: 56,
      tileGap: 10,
    })

    expect(getLayoutTokens('large')).toMatchObject({
      paneCellWidth: 236,
      tileSize: 64,
    })
  })

  it('getPaneMetrics uses tight outer size; gridSpan counts tile-canvas steps', () => {
    const t = getLayoutTokens('medium')
    const m = getPaneMetrics(3, 2, t)
    const tx = getAppColPitch(t)
    const ty = getAppRowPitch(t)

    expect(m.contentWidth).toBe(212)
    expect(m.contentHeight).toBe(16 + 2 * (56 + 4 + 24) + 10 + 16)

    const naturalH = 36 + m.contentHeight
    expect(naturalH).toBe(246)

    expect(m.gridSpanX).toBe(Math.ceil(212 / tx))
    expect(m.gridSpanY).toBe(Math.ceil(246 / ty))
    expect(m.paneWidth).toBe(212)
    expect(m.paneHeight).toBe(naturalH)
    expect(m.renderPaneWidth).toBe(212)
    expect(m.renderPaneHeight).toBe(naturalH)
    expect(m.alignPadBottom).toBe(0)
  })

  it('gridSpanX can exceed natural width in step units without widening the card', () => {
    const t = getLayoutTokens('medium')
    const m = getPaneMetrics(4, 1, t)
    const tx = getAppColPitch(t)
    expect(m.renderPaneWidth).toBe(m.paneWidth)
    expect(m.gridSpanX).toBe(Math.ceil(m.paneWidth / tx))
    expect(m.gridSpanX * tx).toBeGreaterThanOrEqual(m.paneWidth)
  })

  it('single-row pane height matches natural row stack (no vertical slack band)', () => {
    const t = getLayoutTokens('medium')
    const m = getPaneMetrics(3, 1, t)
    const ty = getAppRowPitch(t)
    const contentH = 16 + (56 + 4 + 24) + 16
    const naturalH = 36 + contentH
    expect(m.contentHeight).toBe(contentH)
    expect(m.renderPaneHeight).toBe(naturalH)
    expect(m.gridSpanY).toBe(Math.ceil(naturalH / ty))
    expect(m.paneHeight).toBe(naturalH)
    expect(m.alignPadBottom).toBe(0)
  })

  it('distributes extra horizontal space into column gaps', () => {
    const t = getLayoutTokens('small')
    const inner = getPaneInnerContentWidth(400, t)
    const gap = getColumnGapDistributed(t, 3, inner)
    expect(gap).toBeGreaterThan(t.tileGap)
    const pitch = getAppColPitchDistributed(t, 3, inner)
    expect(pitch).toBe(t.tileSize + gap)
  })

  it('tile layout keeps base gutters when inner width matches the tight matrix', () => {
    const t = getLayoutTokens('medium')
    const m = getPaneMetrics(8, 2, t)
    expect(m.paneWidth).toBe(m.renderPaneWidth)
    const innerTile = getPaneInnerTileWidth(m, t)
    expect(getColumnGapDistributed(t, 8, innerTile)).toBe(t.tileGap)
    expect(getAppColPitchDistributed(t, 8, innerTile)).toBe(t.tileSize + t.tileGap)
  })

  it('getAppColPitch / getAppRowPitch', () => {
    const t = getLayoutTokens('small')
    expect(getAppColPitch(t)).toBe(48 + 10)
    expect(getAppRowPitch(t)).toBe(48 + 4 + 22 + 10)
  })

  it('getDashboardCanvasGridSpec matches tile pitch and content phase', () => {
    const t = getLayoutTokens('medium')
    expect(getDashboardCanvasGridSpec(t)).toEqual({
      tileStepX: getAppColPitch(t),
      tileStepY: getAppRowPitch(t),
      contentOriginX: t.gridInsetX,
      contentOriginY: t.headerHeight + t.gridInsetY,
    })
  })

  it('getPaneCanvasOriginPixels reads leftPx,topPx', () => {
    const t = getLayoutTokens('medium')
    expect(getPaneCanvasOriginPixels({ position: '198,188' }, t)).toEqual({
      paneLeft: 198,
      paneTop: 188,
    })
  })

  it('getAppRenderPosition uses grid insets and row pitch', () => {
    const t = getLayoutTokens('medium')
    const paneLeft = 100
    const paneTop = 200

    const colPitch = getAppColPitch(t)
    const rowPitch = getAppRowPitch(t)

    const p00 = getAppRenderPosition(0, 0, t, paneLeft, paneTop)
    expect(p00).toEqual({
      x: 100 + 12,
      y: 200 + 36 + 16,
    })

    const p21 = getAppRenderPosition(2, 1, t, paneLeft, paneTop)
    expect(p21).toEqual({
      x: 100 + 12 + 2 * colPitch,
      y: 200 + 36 + 16 + 1 * rowPitch,
    })
  })
})
