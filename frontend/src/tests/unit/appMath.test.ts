import { describe, expect, it } from 'vitest'

import {
  appsLinearIndicesFitNewGrid,
  moveOrSwapApps,
  remapAppPositionsForGridResize,
} from '../../features/apps/appMath'
import type { AppItem } from '../../features/config/types'

describe('features/apps/appMath', () => {
  const baseApps: AppItem[] = [
    { id: 'a', name: 'A', position: '0,0', url: 'x', icon: 'i' },
    { id: 'b', name: 'B', position: '1,0', url: 'x', icon: 'i' },
  ]

  it('noop when target equals source', () => {
    const res = moveOrSwapApps({ apps: baseApps, draggedAppId: 'a', targetPosition: '0,0' })
    expect(res.type).toBe('noop')
  })

  it('moves into empty cell', () => {
    const res = moveOrSwapApps({ apps: baseApps, draggedAppId: 'a', targetPosition: '2,0' })
    expect(res.type).toBe('move')
    if (res.type !== 'move') throw new Error('expected move')
    expect(res.apps.find((x) => x.id === 'a')?.position).toBe('2,0')
    expect(res.apps.find((x) => x.id === 'b')?.position).toBe('1,0')
  })

  it('swaps when target is occupied', () => {
    const res = moveOrSwapApps({ apps: baseApps, draggedAppId: 'a', targetPosition: '1,0' })
    expect(res.type).toBe('swap')
    if (res.type !== 'swap') throw new Error('expected swap')
    expect(res.collidedAppId).toBe('b')
    expect(res.apps.find((x) => x.id === 'a')?.position).toBe('1,0')
    expect(res.apps.find((x) => x.id === 'b')?.position).toBe('0,0')
  })

  it('remapAppPositionsForGridResize preserves linear reading order (iOS-style)', () => {
    const apps = [
      { id: 'a', name: 'A', position: '0,0', url: 'x', icon: 'i' },
      { id: 'b', name: 'B', position: '1,0', url: 'x', icon: 'i' },
      { id: 'c', name: 'C', position: '5,0', url: 'x', icon: 'i' },
    ]
    const next = remapAppPositionsForGridResize(apps, 6, 3, 3)
    expect(next.find((x) => x.id === 'a')?.position).toBe('0,0')
    expect(next.find((x) => x.id === 'b')?.position).toBe('1,0')
    expect(next.find((x) => x.id === 'c')?.position).toBe('2,1')
  })

  it('appsLinearIndicesFitNewGrid rejects when an icon would fall off the new grid', () => {
    const apps = [{ id: 'a', name: 'A', position: '5,0', url: 'x', icon: 'i' }]
    expect(appsLinearIndicesFitNewGrid(apps, 6, 3, 1)).toBe(false)
    expect(appsLinearIndicesFitNewGrid(apps, 6, 3, 3)).toBe(true)
  })
})

