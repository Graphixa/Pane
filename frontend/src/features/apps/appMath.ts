import type { AppItem } from '../config/types'
import { formatCoordPair, parseCoordPair } from '../../lib/coords'

export type AppMoveResult =
  | { type: 'noop' }
  | { type: 'move'; apps: AppItem[] }
  | { type: 'swap'; apps: AppItem[]; collidedAppId: string }

export function moveOrSwapApps(params: {
  apps: AppItem[]
  draggedAppId: string
  targetPosition: string // "col,row"
}): AppMoveResult {
  const dragged = params.apps.find((a) => a.id === params.draggedAppId)
  if (!dragged) return { type: 'noop' }

  const sourcePos = dragged.position
  const targetPos = params.targetPosition
  if (sourcePos === targetPos) return { type: 'noop' }

  const collided = params.apps.find((a) => a.id !== dragged.id && a.position === targetPos)
  if (!collided) {
    return {
      type: 'move',
      apps: params.apps.map((a) => (a.id === dragged.id ? { ...a, position: targetPos } : a)),
    }
  }

  return {
    type: 'swap',
    collidedAppId: collided.id,
    apps: params.apps.map((a) => {
      if (a.id === dragged.id) return { ...a, position: targetPos }
      if (a.id === collided.id) return { ...a, position: sourcePos }
      return a
    }),
  }
}

/**
 * Preserve each app's reading-order index (row-major in the *old* column count) when the grid
 * changes size — same idea as iOS home screen when the column count changes.
 * Linear index k = row * oldColumns + col → new col = k % newColumns, new row = floor(k / newColumns).
 */
export function remapAppPositionsForGridResize(
  apps: AppItem[],
  oldColumns: number,
  newColumns: number,
  newRows: number,
): AppItem[] {
  const capacity = newColumns * newRows
  const last = capacity - 1
  return apps.map((app) => {
    const [c, r] = parseCoordPair(app.position)
    const k = r * oldColumns + c
    if (k >= capacity) {
      return {
        ...app,
        position: formatCoordPair(last % newColumns, Math.floor(last / newColumns)),
      }
    }
    return {
      ...app,
      position: formatCoordPair(k % newColumns, Math.floor(k / newColumns)),
    }
  })
}

/** True if every app fits in the new grid by linear index (caller should reject resize otherwise). */
export function appsLinearIndicesFitNewGrid(
  apps: AppItem[],
  oldColumns: number,
  newColumns: number,
  newRows: number,
): boolean {
  const cap = newColumns * newRows
  return apps.every((app) => {
    const [c, r] = parseCoordPair(app.position)
    const k = r * oldColumns + c
    return k < cap
  })
}

