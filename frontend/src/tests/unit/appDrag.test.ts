import { describe, expect, it } from 'vitest'

import { getAppDragPreview } from '../../features/interaction/appDrag'

describe('interaction/appDrag', () => {
  it('resolves pointer into clamped (col,row) with grid insets', () => {
    const appColStep = 56
    const appRowStep = 84
    const gridInsetX = 8
    const gridInsetY = 16

    expect(
      getAppDragPreview({
        pointerX: 100,
        pointerY: 100,
        contentRectLeft: 100,
        contentRectTop: 100,
        appColStep,
        appRowStep,
        gridInsetX,
        gridInsetY,
        appColumns: 3,
        appRows: 2,
      }),
    ).toEqual({ previewCol: 0, previewRow: 0 })

    // Local (132, 16) -> adj (124, 0) -> round(124/56)=2, round(0/84)=0
    expect(
      getAppDragPreview({
        pointerX: 232,
        pointerY: 116,
        contentRectLeft: 100,
        contentRectTop: 100,
        appColStep,
        appRowStep,
        gridInsetX,
        gridInsetY,
        appColumns: 3,
        appRows: 2,
      }),
    ).toEqual({ previewCol: 2, previewRow: 0 })

    expect(
      getAppDragPreview({
        pointerX: -999,
        pointerY: 9999,
        contentRectLeft: 100,
        contentRectTop: 100,
        appColStep,
        appRowStep,
        gridInsetX,
        gridInsetY,
        appColumns: 3,
        appRows: 2,
      }),
    ).toEqual({ previewCol: 0, previewRow: 1 })
  })
})
