import { describe, expect, it } from 'vitest'

import {
  getAppColPitch,
  getAppColPitchDistributed,
  getAppRenderPosition,
  getAppRowPitch,
  getColumnGapDistributed,
  getLayoutTokens,
  getPaneInnerContentWidth,
  getPaneMetrics,
  getPanePlacementSteps,
} from '../../features/layout/paneMath'

describe('layout/paneMath', () => {
  it('getLayoutTokens returns diagram-aligned preset values', () => {
    expect(getLayoutTokens('small')).toMatchObject({
      paneCellWidth: 176,
      paneCellHeight: 112,
      paneGap: 8,
      tileSize: 48,
      tileGap: 8,
      iconLabelGap: 4,
      labelBandHeight: 22,
      appCellHeight: 48 + 4 + 22,
      gridInsetX: 8,
      gridInsetY: 16,
      headerHeight: 36,
    })

    expect(getLayoutTokens('medium')).toMatchObject({
      paneCellWidth: 200,
      tileSize: 56,
      tileGap: 8,
    })

    expect(getLayoutTokens('large')).toMatchObject({
      paneCellWidth: 224,
      tileSize: 64,
    })
  })

  it('getPaneMetrics matches guttered content and macro snap', () => {
    const t = getLayoutTokens('medium')
    const m = getPaneMetrics(3, 2, t)

    // contentWidth = 8 + 3*56 + 2*8 + 8 = 200
    expect(m.contentWidth).toBe(200)

    // contentHeight = 16 + 2*84 + 8 + 16 = 208
    expect(m.contentHeight).toBe(16 + 2 * (56 + 4 + 24) + 8 + 16)

    const naturalH = 36 + m.contentHeight
    expect(naturalH).toBe(244)

    expect(m.gridSpanX).toBe(Math.ceil(200 / 200))
    expect(m.gridSpanY).toBe(Math.ceil(244 / 124))
    expect(m.paneWidth).toBe(200)
    expect(m.paneHeight).toBe(2 * 124 + 8)
    expect(m.renderPaneWidth).toBe(200)
    expect(m.renderPaneHeight).toBe(naturalH)
    expect(m.alignPadX).toBe(0)
    expect(m.alignPadBottom).toBe(m.paneHeight - naturalH)
  })

  it('single-row pane uses tight render height (no fake second row)', () => {
    const t = getLayoutTokens('medium')
    const m = getPaneMetrics(3, 1, t)
    const contentH = 16 + (56 + 4 + 24) + 16
    const naturalH = 36 + contentH
    expect(m.contentHeight).toBe(contentH)
    expect(m.renderPaneHeight).toBe(naturalH)
    expect(m.gridSpanY).toBe(Math.ceil(naturalH / t.paneCellHeight))
    expect(m.paneHeight).toBeGreaterThan(m.renderPaneHeight)
  })

  it('distributes extra horizontal space into column gaps', () => {
    const t = getLayoutTokens('small')
    const inner = getPaneInnerContentWidth(400, t)
    const gap = getColumnGapDistributed(t, 3, inner)
    expect(gap).toBeGreaterThan(t.tileGap)
    const pitch = getAppColPitchDistributed(t, 3, inner)
    expect(pitch).toBe(t.tileSize + gap)
  })

  it('getPanePlacementSteps separates X and Y', () => {
    const t = getLayoutTokens('small')
    expect(getPanePlacementSteps(t)).toEqual({ stepX: 176 + 8, stepY: 112 + 8 })
  })

  it('getAppColPitch / getAppRowPitch', () => {
    const t = getLayoutTokens('small')
    expect(getAppColPitch(t)).toBe(48 + 8)
    expect(getAppRowPitch(t)).toBe(48 + 4 + 22 + 8)
  })

  it('getAppRenderPosition uses grid insets and row pitch', () => {
    const t = getLayoutTokens('medium')
    const paneLeft = 100
    const paneTop = 200

    const colPitch = getAppColPitch(t)
    const rowPitch = getAppRowPitch(t)

    const p00 = getAppRenderPosition(0, 0, t, paneLeft, paneTop)
    expect(p00).toEqual({
      x: 100 + 8,
      y: 200 + 36 + 16,
    })

    const p21 = getAppRenderPosition(2, 1, t, paneLeft, paneTop)
    expect(p21).toEqual({
      x: 100 + 8 + 2 * colPitch,
      y: 200 + 36 + 16 + 1 * rowPitch,
    })
  })
})
