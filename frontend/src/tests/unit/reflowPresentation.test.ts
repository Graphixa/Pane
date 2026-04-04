import { describe, expect, it } from 'vitest'

import type { DashboardConfig, PaneItem } from '../../features/config/types'
import { fixDashboardLayout } from '../../features/layout/fixDashboardLayout'
import {
  buildReflowPresentation,
  computeDashboardContentExtent,
  needsDashboardReflow,
} from '../../features/layout/reflowPresentation'
import { getLayoutTokens, getPaneMetrics } from '../../features/layout/paneMath'

function paneAt(id: string, x: number, y: number, cols = 3, rows = 1): PaneItem {
  return {
    id,
    label: id,
    position: `${x},${y}`,
    appColumns: cols,
    appRows: rows,
    apps: [],
  }
}

function minimalConfig(panes: PaneItem[]): DashboardConfig {
  return {
    version: 2,
    title: 't',
    layout: { widthMode: 'full' },
    appLayout: { size: 'medium' },
    appearance: { accent: '#fff', background: '#000' },
    panes,
  }
}

describe('layout/reflowPresentation', () => {
  it('needsDashboardReflow matches content extent vs canvas', () => {
    const cfg = minimalConfig([paneAt('a', 0, 0), paneAt('b', 220, 0)])
    const tokens = getLayoutTokens('medium')
    const { width } = computeDashboardContentExtent(cfg, tokens)
    expect(needsDashboardReflow(cfg, width - 1, 'medium')).toBe(true)
    expect(needsDashboardReflow(cfg, width, 'medium')).toBe(false)
    expect(needsDashboardReflow(cfg, undefined, 'medium')).toBe(false)
  })

  it('buildReflowPresentation matches fixDashboardLayout row structure (pane ids per row)', () => {
    const cfg = minimalConfig([paneAt('a', 0, 0), paneAt('b', 220, 0)])
    const t = getLayoutTokens('medium')
    const m = getPaneMetrics(3, 1, t)
    const w = m.paneWidth
    const canvas = w + t.paneGap + Math.floor(w / 2)

    const pres = buildReflowPresentation(cfg, canvas, 'medium')
    expect(pres).not.toBeNull()
    const presRows = pres!.rows.map((r) => r.map((e) => e.pane.id))

    const { config: fixed } = fixDashboardLayout(cfg, canvas, 'medium')
    const presAfter = buildReflowPresentation(fixed, canvas, 'medium')
    expect(presAfter).not.toBeNull()
    const afterRows = presAfter!.rows.map((r) => r.map((e) => e.pane.id))

    expect(presRows).toEqual(afterRows)
  })

  it('buildReflowPresentation wraps using fitted metrics on narrow canvas', () => {
    const cfg = minimalConfig([paneAt('a', 0, 0), paneAt('b', 220, 0)])
    const t = getLayoutTokens('medium')
    const m = getPaneMetrics(3, 1, t)
    const narrow = Math.min(m.paneWidth, 320)
    const pres = buildReflowPresentation(cfg, narrow, 'medium')
    expect(pres).not.toBeNull()
    expect(pres!.rows.length).toBeGreaterThanOrEqual(1)
    const flat = pres!.rows.flat()
    expect(flat.every((e) => e.metrics.paneWidth <= narrow)).toBe(true)
  })
})
