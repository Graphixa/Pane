export function getPaneDragPreview(
  startGridX: number,
  startGridY: number,
  deltaX: number,
  deltaY: number,
  stepX: number,
  stepY: number,
): { previewGridX: number; previewGridY: number } {
  const deltaGridX = Math.round(deltaX / stepX)
  const deltaGridY = Math.round(deltaY / stepY)

  return {
    previewGridX: Math.max(0, startGridX + deltaGridX),
    previewGridY: Math.max(0, startGridY + deltaGridY),
  }
}
