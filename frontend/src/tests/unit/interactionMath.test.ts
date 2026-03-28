import { describe, expect, it } from 'vitest'

import { getPaneDragPreview } from '../../features/interaction/paneDrag'
import { getPaneResizePreview } from '../../features/interaction/paneResize'

describe('interaction math', () => {
  it('converts drag pointer delta into pane grid preview', () => {
    const step = 176 // paneCellSize + paneGap for medium (168 + 8)
    const preview = getPaneDragPreview(3, 4, 320, -200, step)
    // round(320 / 176) = 2, round(-200 / 176) = -1
    expect(preview).toEqual({ previewGridX: 5, previewGridY: 3 })
  })

  it('converts resize pointer delta into app columns/rows', () => {
    const step = 74 // tileSize + tileGap for medium (56 + 18)
    expect(getPaneResizePreview('right', 3, 2, 130, 100, step)).toEqual({
      previewColumns: 5,
      previewRows: 2,
    })
    // round(100/74)=1 → rows 2+1=3
    expect(getPaneResizePreview('bottom', 3, 2, 130, 100, step)).toEqual({
      previewColumns: 3,
      previewRows: 3,
    })
    expect(getPaneResizePreview('bottom-right', 3, 2, -500, -500, step)).toEqual({
      previewColumns: 3,
      previewRows: 1,
    })
  })
})

