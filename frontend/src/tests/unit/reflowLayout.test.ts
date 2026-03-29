import { describe, expect, it } from 'vitest'

import type { PaneItem } from '../../features/config/types'
import { computeReflowRows, sortPanesForReflow } from '../../features/layout/reflowLayout'
import { getLayoutTokens, getPaneMetrics } from '../../features/layout/paneMath'

function paneAt(id: string, x: number, y: number): PaneItem {
  return {
    id,
    label: id,
    position: `${x},${y}`,
    appColumns: 3,
    appRows: 1,
    apps: [],
  }
}

describe('layout/reflowLayout', () => {
  it('sortPanesForReflow orders by grid Y then X', () => {
    const t = getLayoutTokens('medium')
    const entries = [
      { pane: paneAt('b', 1, 1), metrics: getPaneMetrics(3, 1, t) },
      { pane: paneAt('a', 0, 0), metrics: getPaneMetrics(3, 1, t) },
      { pane: paneAt('c', 0, 1), metrics: getPaneMetrics(3, 1, t) },
    ]
    const sorted = sortPanesForReflow(entries)
    expect(sorted.map((e) => e.pane.id)).toEqual(['a', 'c', 'b'])
  })

  it('computeReflowRows wraps to the next row when row is full', () => {
    const t = getLayoutTokens('medium')
    const m = getPaneMetrics(3, 1, t)
    const w = m.renderPaneWidth
    const entries = [
      { pane: paneAt('a', 0, 0), metrics: m },
      { pane: paneAt('b', 1, 0), metrics: m },
    ]
    const gap = t.paneGap
    const available = w + gap + Math.floor(w / 2)
    const { rows, contentWidth, contentHeight } = computeReflowRows(entries, available, gap)
    expect(rows.map((r) => r.map((e) => e.pane.id))).toEqual([['a'], ['b']])
    expect(contentWidth).toBeLessThanOrEqual(available)
    expect(contentHeight).toBeGreaterThan(m.renderPaneHeight)
  })
})
