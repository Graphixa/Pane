import type { PointerPoint, PointerSession } from './dragTypes'

export function createPointerSession(pointerId: number, start: PointerPoint): PointerSession {
  return {
    pointerId,
    start,
    current: start,
    delta: { x: 0, y: 0 },
  }
}

export function updatePointerSession(
  session: PointerSession,
  current: PointerPoint,
): PointerSession {
  return {
    ...session,
    current,
    delta: {
      x: current.x - session.start.x,
      y: current.y - session.start.y,
    },
  }
}

