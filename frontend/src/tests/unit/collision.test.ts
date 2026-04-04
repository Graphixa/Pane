import { describe, expect, it } from 'vitest'

import { isValidPanePlacement } from '../../features/interaction/collision'
import type { PaneItem } from '../../features/config/types'

describe('interaction/collision', () => {
  it('rejects overlapping placements (pixel positions + minimum gap)', () => {
    const panes: PaneItem[] = [
      { id: 'p1', label: 'P1', position: '0,0', appColumns: 5, appRows: 1, apps: [] },
      // 6 * (48+10) = 348px — was tile index 6; now explicit pixels
      { id: 'p2', label: 'P2', position: '348,0', appColumns: 3, appRows: 2, apps: [] },
    ]
    expect(
      isValidPanePlacement({ panes, appSize: 'small', paneId: 'p1', x: 300, y: 0 }),
    ).toBe(false)
  })

  it('allows non-overlapping placements', () => {
    const panes: PaneItem[] = [
      { id: 'p1', label: 'P1', position: '0,0', appColumns: 5, appRows: 1, apps: [] },
      { id: 'p2', label: 'P2', position: '348,0', appColumns: 3, appRows: 2, apps: [] },
    ]
    expect(
      isValidPanePlacement({ panes, appSize: 'small', paneId: 'p1', x: 0, y: 400 }),
    ).toBe(true)
  })

  it('rejects placements that extend past maxContentWidthPx', () => {
    const narrow: PaneItem[] = [
      { id: 'p1', label: 'P1', position: '0,0', appColumns: 3, appRows: 1, apps: [] },
    ]
    expect(
      isValidPanePlacement({
        panes: narrow,
        appSize: 'medium',
        paneId: 'p1',
        x: 0,
        y: 0,
        maxContentWidthPx: 2000,
      }),
    ).toBe(true)
    expect(
      isValidPanePlacement({
        panes: narrow,
        appSize: 'medium',
        paneId: 'p1',
        x: 4,
        y: 0,
        maxContentWidthPx: 200,
      }),
    ).toBe(false)
  })

  it('rejects when natural pane width exceeds maxContentWidthPx', () => {
    const wideContent: PaneItem[] = [
      { id: 'p1', label: 'P1', position: '0,0', appColumns: 4, appRows: 1, apps: [] },
    ]
    expect(
      isValidPanePlacement({
        panes: wideContent,
        appSize: 'medium',
        paneId: 'p1',
        x: 0,
        y: 0,
        maxContentWidthPx: 260,
      }),
    ).toBe(false)
  })
})
