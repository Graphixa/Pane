function clamp(min: number, value: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function getAppDragPreview(params: {
  pointerX: number
  pointerY: number
  contentRectLeft: number
  contentRectTop: number
  tileStep: number
  appColumns: number
  appRows: number
}): { previewCol: number; previewRow: number } {
  const localX = params.pointerX - params.contentRectLeft
  const localY = params.pointerY - params.contentRectTop

  const rawCol = Math.round(localX / params.tileStep)
  const rawRow = Math.round(localY / params.tileStep)

  return {
    previewCol: clamp(0, rawCol, params.appColumns - 1),
    previewRow: clamp(0, rawRow, params.appRows - 1),
  }
}

