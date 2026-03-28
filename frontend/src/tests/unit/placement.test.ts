import { describe, expect, it } from 'vitest'
import type { PaneItem } from '../../features/config/types'
import { findFirstFreeAppCell, findNextPaneGridPosition } from '../../features/layout/placement'

describe('findFirstFreeAppCell', () => {
  it('returns first gap in row-major order', () => {
    expect(findFirstFreeAppCell([{ position: '0,0' }], 3, 2)).toEqual({ col: 1, row: 0 })
    expect(findFirstFreeAppCell([], 2, 2)).toEqual({ col: 0, row: 0 })
  })

  it('returns null when full', () => {
    const apps = [
      { position: '0,0' },
      { position: '1,0' },
      { position: '0,1' },
      { position: '1,1' },
    ]
    expect(findFirstFreeAppCell(apps, 2, 2)).toBeNull()
  })
})

describe('findNextPaneGridPosition', () => {
  it('places at origin when no panes', () => {
    expect(findNextPaneGridPosition([], 'medium', { appColumns: 3, appRows: 1 })).toEqual({
      x: 0,
      y: 0,
    })
  })

  it('avoids overlap with existing pane', () => {
    const existing: PaneItem = {
      id: 'a',
      label: 'A',
      position: '0,0',
      appColumns: 3,
      appRows: 1,
      apps: [],
    }
    const pos = findNextPaneGridPosition([existing], 'medium', { appColumns: 3, appRows: 1 })
    expect(pos.x === 0 && pos.y === 0).toBe(false)
  })
})
