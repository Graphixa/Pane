import { describe, expect, it } from 'vitest'

import { isValidPanePlacement } from '../../features/interaction/collision'
import type { PaneItem } from '../../features/config/types'

describe('interaction/collision', () => {
  const panes: PaneItem[] = [
    { id: 'p1', label: 'P1', position: '0,0', appColumns: 3, appRows: 2, apps: [] },
    { id: 'p2', label: 'P2', position: '2,0', appColumns: 3, appRows: 2, apps: [] },
  ]

  it('rejects overlapping placements', () => {
    // p1 medium spans ceil(236/168)=2 wide. p2 at x=2 starts adjacent. Moving p1 to x=1 should overlap.
    expect(
      isValidPanePlacement({ panes, appSize: 'medium', paneId: 'p1', x: 1, y: 0 }),
    ).toBe(false)
  })

  it('allows non-overlapping placements', () => {
    expect(
      isValidPanePlacement({ panes, appSize: 'medium', paneId: 'p1', x: 0, y: 1 }),
    ).toBe(true)
  })
})

