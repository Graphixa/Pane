import { describe, expect, it } from 'vitest'

import { getPaneDragPreview } from '../../features/interaction/paneDrag'
import { getPaneResizePreview } from '../../features/interaction/paneResize'

describe('interaction math', () => {
  it('converts drag pointer delta into pane grid preview', () => {
    const stepX = 184
    const stepY = 120
    const preview = getPaneDragPreview(3, 4, 320, -200, stepX, stepY)
    // round(320 / 184) = 2, round(-200 / 120) = -2
    expect(preview).toEqual({ previewGridX: 5, previewGridY: 2 })
  })

  it('converts resize pointer delta into app columns/rows', () => {
    const colStep = 64
    const rowStep = 92
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
