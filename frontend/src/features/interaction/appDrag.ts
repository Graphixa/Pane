function clamp(min: number, value: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function getAppDragPreview(params: {
  pointerX: number
  pointerY: number
  contentRectLeft: number
  contentRectTop: number
  appColStep: number
  appRowStep: number
  gridInsetX: number
  gridInsetY: number
  appColumns: number
  appRows: number
}): { previewCol: number; previewRow: number } {
  const localX = params.pointerX - params.contentRectLeft
  const localY = params.pointerY - params.contentRectTop

  const adjX = localX - params.gridInsetX
  const adjY = localY - params.gridInsetY

  const rawCol = Math.round(adjX / params.appColStep)
  const rawRow = Math.round(adjY / params.appRowStep)

  return {
    previewCol: clamp(0, rawCol, params.appColumns - 1),
    previewRow: clamp(0, rawRow, params.appRows - 1),
  }
}
