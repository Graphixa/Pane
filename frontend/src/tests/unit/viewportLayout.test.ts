import { describe, expect, it } from 'vitest'

import {
  getEffectiveTileSizeForCanvasWidth,
  NARROW_CANVAS_WIDTH_PX,
} from '../../features/layout/viewportLayout'

describe('layout/viewportLayout', () => {
  it('uses configured size when canvas width is unknown', () => {
    expect(getEffectiveTileSizeForCanvasWidth(undefined, 'large')).toBe('large')
    expect(getEffectiveTileSizeForCanvasWidth(0, 'medium')).toBe('medium')
  })

  it('uses small below narrow breakpoint', () => {
    expect(getEffectiveTileSizeForCanvasWidth(NARROW_CANVAS_WIDTH_PX - 1, 'large')).toBe('small')
    expect(getEffectiveTileSizeForCanvasWidth(320, 'medium')).toBe('small')
  })

  it('uses configured size at or above narrow breakpoint', () => {
    expect(getEffectiveTileSizeForCanvasWidth(NARROW_CANVAS_WIDTH_PX, 'large')).toBe('large')
    expect(getEffectiveTileSizeForCanvasWidth(1200, 'medium')).toBe('medium')
  })
})
