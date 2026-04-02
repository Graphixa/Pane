import type { TileSizePreset } from '../config/types'

/** Ignore scrollbar / chrome jitter when deciding to repack + PUT while overflowing. */
export const MEANINGFUL_SHRINK_PX = 24

export type NarrowPersistTriggerInput = {
  needsReflow: boolean
  canvasWidth: number
  effectivePreset: TileSizePreset
  /** Last canvas width used as baseline (updated while not overflowing, and after each overflow layout pass). */
  lastCanvasWidthBaseline: number | null
  lastEffectivePreset: TileSizePreset | null
  initialOverflowPackDone: boolean
  /**
   * Edit mode: repack on any measured width decrease while overflowing (responsive to narrowing).
   * View mode: use {@link MEANINGFUL_SHRINK_PX} to ignore scrollbar jitter.
   */
  shrinkOnAnyWidthDecrease?: boolean
}

export type NarrowPersistTriggerResult = {
  shouldPack: boolean
  /** Caller should set `initialOverflowPackDoneRef` to true when true. */
  markInitialOverflowHandled: boolean
  reason: 'first_overflow' | 'shrink' | 'preset_flip' | null
}

/**
 * Pure trigger rules for narrow reflow persistence (v1).
 */
export function evaluateNarrowPersistTriggers(
  input: NarrowPersistTriggerInput,
): NarrowPersistTriggerResult {
  const {
    needsReflow,
    canvasWidth,
    effectivePreset,
    lastCanvasWidthBaseline,
    lastEffectivePreset,
    initialOverflowPackDone,
    shrinkOnAnyWidthDecrease = false,
  } = input

  if (!needsReflow) {
    return { shouldPack: false, markInitialOverflowHandled: false, reason: null }
  }

  const firstOverflow = !initialOverflowPackDone
  const shrink = shrinkOnAnyWidthDecrease
    ? lastCanvasWidthBaseline !== null && lastCanvasWidthBaseline > canvasWidth
    : lastCanvasWidthBaseline !== null &&
      lastCanvasWidthBaseline - canvasWidth >= MEANINGFUL_SHRINK_PX
  const presetFlip =
    lastEffectivePreset !== null && lastEffectivePreset !== effectivePreset

  const shouldPack = firstOverflow || shrink || presetFlip
  let reason: NarrowPersistTriggerResult['reason'] = null
  if (shouldPack) {
    if (firstOverflow) reason = 'first_overflow'
    else if (shrink) reason = 'shrink'
    else reason = 'preset_flip'
  }

  return {
    shouldPack,
    markInitialOverflowHandled: firstOverflow,
    reason,
  }
}
