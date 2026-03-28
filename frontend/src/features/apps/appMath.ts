import type { AppItem } from '../config/types'

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

