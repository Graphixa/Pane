import { describe, expect, it } from 'vitest'

import { getAppRenderPosition, getLayoutTokens, getPaneMetrics } from '../../features/layout/paneMath'

describe('layout/paneMath', () => {
  it('getLayoutTokens returns the preset token values', () => {
    expect(getLayoutTokens('small')).toMatchObject({
      paneCellSize: 144,
      paneGap: 8,
      tileSize: 48,
      tileGap: 18,
      panePaddingLeft: 16,
      panePaddingRight: 16,
      panePaddingTop: 18,
      panePaddingBottom: 18,
      headerHeight: 36,
    })

    expect(getLayoutTokens('medium')).toMatchObject({
      paneCellSize: 168,
      tileSize: 56,
    })

    expect(getLayoutTokens('large')).toMatchObject({
      paneCellSize: 192,
      tileSize: 64,
    })
  })

  it('getPaneMetrics computes content and pane dimensions deterministically', () => {
    const t = getLayoutTokens('medium') // tileSize=56, tileGap=18, header=36, paddings=16/16/18/18

    const m = getPaneMetrics(3, 2, t)

    // contentWidth = 3*56 + 2*18 = 204
    // contentHeight = 2*56 + 1*18 = 130
    // paneWidth = 16 + 204 + 16 = 236
    // paneHeight = 36 + 18 + 130 + 18 = 202
    expect(m.contentWidth).toBe(204)
    expect(m.contentHeight).toBe(130)
    expect(m.paneWidth).toBe(236)
    expect(m.paneHeight).toBe(202)

    // grid spans ceil(width / paneCellSize)
    expect(m.gridSpanX).toBe(Math.ceil(236 / 168))
    expect(m.gridSpanY).toBe(Math.ceil(202 / 168))

    // insets are derived from tokens only
    expect(m.contentLeftInset).toBe(16)
    expect(m.contentTopInset).toBe(36 + 18)
  })

  it('getAppRenderPosition uses content origin + per-tile step', () => {
    const t = getLayoutTokens('medium')
    const paneLeft = 100
    const paneTop = 200

    // step = tileSize + tileGap = 74
    const p00 = getAppRenderPosition(0, 0, t, paneLeft, paneTop)
    expect(p00).toEqual({
      x: 100 + 16,
      y: 200 + 36 + 18,
    })

    const p21 = getAppRenderPosition(2, 1, t, paneLeft, paneTop)
    expect(p21).toEqual({
      x: 100 + 16 + 2 * 74,
      y: 200 + 36 + 18 + 1 * 74,
    })
  })
})

