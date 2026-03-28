/** Easier vertical resize: less pointer travel per row step. */
const ROW_RESIZE_SENSITIVITY = 0.78

export function getPaneResizePreview(
  edge: 'right' | 'bottom' | 'bottom-right',
  startColumns: number,
  startRows: number,
  deltaX: number,
  deltaY: number,
  appColStep: number,
  appRowStep: number,
): { previewColumns: number; previewRows: number } {
  const columnDelta = Math.round(deltaX / appColStep)
  const rowDelta = Math.round(deltaY / (appRowStep * ROW_RESIZE_SENSITIVITY))

  const nextColumns =
    edge === 'right' || edge === 'bottom-right'
      ? Math.max(3, startColumns + columnDelta)
      : startColumns
  const nextRows =
    edge === 'bottom' || edge === 'bottom-right'
      ? Math.max(1, startRows + rowDelta)
      : startRows

  return {
    previewColumns: nextColumns,
    previewRows: nextRows,
  }
}
