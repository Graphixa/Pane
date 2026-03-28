import { describe, expect, it } from 'vitest'

import { isValidPanePlacement } from '../../features/interaction/collision'
import type { PaneItem } from '../../features/config/types'

describe('interaction/collision', () => {
  const panes: PaneItem[] = [
    { id: 'p1', label: 'P1', position: '0,0', appColumns: 5, appRows: 1, apps: [] },
    { id: 'p2', label: 'P2', position: '2,0', appColumns: 3, appRows: 2, apps: [] },
  ]

  it('rejects overlapping placements', () => {
    // Wide p1 (5 cols, small) spans 2 macro columns; p2 sits at x=2. Moving p1 to x=1 overlaps p2.
    expect(
      isValidPanePlacement({ panes, appSize: 'small', paneId: 'p1', x: 1, y: 0 }),
    ).toBe(false)
  })

  it('allows non-overlapping placements', () => {
    expect(
      isValidPanePlacement({ panes, appSize: 'small', paneId: 'p1', x: 0, y: 1 }),
    ).toBe(true)
  })
})
