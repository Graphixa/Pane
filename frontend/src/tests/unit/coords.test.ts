import { describe, expect, it } from 'vitest'

import { parseCoordPair, parseCoordPairSafe } from '../../lib/coords'

describe('lib/coords', () => {
  it('parseCoordPairSafe accepts valid pairs', () => {
    expect(parseCoordPairSafe('0,0')).toEqual([0, 0])
    expect(parseCoordPairSafe(' 3,12 ')).toEqual([3, 12])
  })

  it('parseCoordPairSafe returns null for invalid strings', () => {
    expect(parseCoordPairSafe('')).toBeNull()
    expect(parseCoordPairSafe('0, 5')).toBeNull()
    expect(parseCoordPairSafe('nope')).toBeNull()
  })

  it('parseCoordPair still throws on invalid input', () => {
    expect(() => parseCoordPair('bad')).toThrow()
  })
})
