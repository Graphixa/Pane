import { describe, expect, it } from 'vitest'

import { getAppDragPreview } from '../../features/interaction/appDrag'

describe('interaction/appDrag', () => {
  it('resolves pointer into clamped (col,row)', () => {
    const tileStep = 74 // medium: 56 + 18

    expect(
      getAppDragPreview({
        pointerX: 100,
        pointerY: 100,
        contentRectLeft: 100,
        contentRectTop: 100,
        tileStep,
        appColumns: 3,
        appRows: 2,
      }),
    ).toEqual({ previewCol: 0, previewRow: 0 })

    // Local (132, 0) -> round(132/74)=2, round(0/74)=0
    expect(
      getAppDragPreview({
        pointerX: 232,
        pointerY: 100,
        contentRectLeft: 100,
        contentRectTop: 100,
        tileStep,
        appColumns: 3,
        appRows: 2,
      }),
    ).toEqual({ previewCol: 2, previewRow: 0 })

    // Out of bounds clamps.
    expect(
      getAppDragPreview({
        pointerX: -999,
        pointerY: 9999,
        contentRectLeft: 100,
        contentRectTop: 100,
        tileStep,
        appColumns: 3,
        appRows: 2,
      }),
    ).toEqual({ previewCol: 0, previewRow: 1 })
  })
})

