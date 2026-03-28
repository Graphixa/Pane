export function getPaneDragPreview(
  startGridX: number,
  startGridY: number,
  deltaX: number,
  deltaY: number,
  paneGridStep: number,
): { previewGridX: number; previewGridY: number } {
  const deltaGridX = Math.round(deltaX / paneGridStep)
  const deltaGridY = Math.round(deltaY / paneGridStep)

  return {
    previewGridX: Math.max(0, startGridX + deltaGridX),
    previewGridY: Math.max(0, startGridY + deltaGridY),
  }
}

