import { describe, expect, it } from 'vitest'

import { getPaneDragPreview } from '../../features/interaction/paneDrag'
import { getPaneResizePreview } from '../../features/interaction/paneResize'

describe('interaction math', () => {
  it('converts drag pointer delta into pane grid preview', () => {
    const stepX = 66
    const stepY = 94
    const preview = getPaneDragPreview(396, 94, 320, -200, stepX, stepY)
    expect(preview).toEqual({ previewLeftPx: 726, previewTopPx: 0 })
  })

  it('converts resize pointer delta into app columns/rows', () => {
    const colStep = 66
    const rowStep = 94
    expect(getPaneResizePreview('right', 3, 2, 130, 100, colStep, rowStep)).toEqual({
      previewColumns: 5,
      previewRows: 2,
    })
    expect(getPaneResizePreview('bottom', 3, 2, 130, 100, colStep, rowStep)).toEqual({
      previewColumns: 3,
      previewRows: 3,
    })
    expect(getPaneResizePreview('bottom-right', 3, 2, -500, -500, colStep, rowStep)).toEqual({
      previewColumns: 3,
      previewRows: 1,
    })
  })
})
