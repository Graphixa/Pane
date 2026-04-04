const coordPairRe = /^\s*(\d+),(\d+)\s*$/

export function parseCoordPair(value: string): [number, number] {
  const match = coordPairRe.exec(value)
  if (!match) throw new Error(`Invalid coordinate format: ${value}`)
  return [Number(match[1]), Number(match[2])]
}

/** Same as {@link parseCoordPair} but returns `null` instead of throwing (bad persisted data). */
export function parseCoordPairSafe(value: string): [number, number] | null {
  const match = coordPairRe.exec(value)
  if (!match) return null
  return [Number(match[1]), Number(match[2])]
}

export function formatCoordPair(x: number, y: number): string {
  return `${x},${y}`
}

