/**
 * Pixel-space drag preview. Pass **app tile canvas** steps: `getAppColPitch` / `getAppRowPitch`.
 */
export function getPaneDragPreview(
  startLeftPx: number,
  startTopPx: number,
  deltaX: number,
  deltaY: number,
  snapStepX: number,
  snapStepY: number,
): { previewLeftPx: number; previewTopPx: number } {
  const dx = Math.round(deltaX / snapStepX) * snapStepX
  const dy = Math.round(deltaY / snapStepY) * snapStepY

  return {
    previewLeftPx: Math.max(0, startLeftPx + dx),
    previewTopPx: Math.max(0, startTopPx + dy),
  }
}
