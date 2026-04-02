import { describe, expect, it } from 'vitest'

import {
  evaluateNarrowPersistTriggers,
  MEANINGFUL_SHRINK_PX,
} from '../../features/layout/narrowLayoutPersist'

describe('layout/narrowLayoutPersist', () => {
  it('first overflow requests pack and marks initial handled', () => {
    const r = evaluateNarrowPersistTriggers({
      needsReflow: true,
      canvasWidth: 400,
      effectivePreset: 'medium',
      lastCanvasWidthBaseline: 800,
      lastEffectivePreset: 'medium',
      initialOverflowPackDone: false,
    })
    expect(r.shouldPack).toBe(true)
    expect(r.markInitialOverflowHandled).toBe(true)
    expect(r.reason).toBe('first_overflow')
  })

  it('meaningful shrink while overflowing requests pack', () => {
    const r = evaluateNarrowPersistTriggers({
      needsReflow: true,
      canvasWidth: 400,
      effectivePreset: 'medium',
      lastCanvasWidthBaseline: 400 + MEANINGFUL_SHRINK_PX,
      lastEffectivePreset: 'medium',
      initialOverflowPackDone: true,
    })
    expect(r.shouldPack).toBe(true)
    expect(r.markInitialOverflowHandled).toBe(false)
    expect(r.reason).toBe('shrink')
  })

  it('ignores sub-threshold width jitter', () => {
    const r = evaluateNarrowPersistTriggers({
      needsReflow: true,
      canvasWidth: 800 - (MEANINGFUL_SHRINK_PX - 1),
      effectivePreset: 'medium',
      lastCanvasWidthBaseline: 800,
      lastEffectivePreset: 'medium',
      initialOverflowPackDone: true,
    })
    expect(r.shouldPack).toBe(false)
    expect(r.reason).toBe(null)
  })

  it('preset flip while overflowing requests pack', () => {
    const r = evaluateNarrowPersistTriggers({
      needsReflow: true,
      canvasWidth: 500,
      effectivePreset: 'small',
      lastCanvasWidthBaseline: 500,
      lastEffectivePreset: 'medium',
      initialOverflowPackDone: true,
    })
    expect(r.shouldPack).toBe(true)
    expect(r.reason).toBe('preset_flip')
  })

  it('no pack when not overflowing', () => {
    const r = evaluateNarrowPersistTriggers({
      needsReflow: false,
      canvasWidth: 1200,
      effectivePreset: 'medium',
      lastCanvasWidthBaseline: 1200,
      lastEffectivePreset: 'medium',
      initialOverflowPackDone: true,
    })
    expect(r.shouldPack).toBe(false)
    expect(r.markInitialOverflowHandled).toBe(false)
  })

  it('shrinkOnAnyWidthDecrease packs on sub-threshold width decrease', () => {
    const r = evaluateNarrowPersistTriggers({
      needsReflow: true,
      canvasWidth: 800 - 10,
      effectivePreset: 'medium',
      lastCanvasWidthBaseline: 800,
      lastEffectivePreset: 'medium',
      initialOverflowPackDone: true,
      shrinkOnAnyWidthDecrease: true,
    })
    expect(r.shouldPack).toBe(true)
    expect(r.reason).toBe('shrink')
  })

  it('without shrinkOnAnyWidthDecrease, sub-threshold jitter does not pack', () => {
    const r = evaluateNarrowPersistTriggers({
      needsReflow: true,
      canvasWidth: 800 - 10,
      effectivePreset: 'medium',
      lastCanvasWidthBaseline: 800,
      lastEffectivePreset: 'medium',
      initialOverflowPackDone: true,
      shrinkOnAnyWidthDecrease: false,
    })
    expect(r.shouldPack).toBe(false)
  })
})
