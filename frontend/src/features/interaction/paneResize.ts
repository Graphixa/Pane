export function getPaneResizePreview(
  edge: 'right' | 'bottom' | 'bottom-right',
  startColumns: number,
  startRows: number,
  deltaX: number,
  deltaY: number,
  tileStep: number,
): { previewColumns: number; previewRows: number } {
  const columnDelta = Math.round(deltaX / tileStep)
  const rowDelta = Math.round(deltaY / tileStep)

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

