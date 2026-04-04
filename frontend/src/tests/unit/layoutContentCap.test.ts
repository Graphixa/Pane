import { describe, expect, it } from 'vitest'

import type { DashboardConfig, PaneItem } from '../../features/config/types'
import {
  layoutContentCapPx,
  shouldReorganizePanesForNarrowerLayout,
} from '../../features/layout/layoutContentCap'

function baseConfig(overrides: Partial<DashboardConfig> = {}): DashboardConfig {
  const panes: PaneItem[] = [
    { id: 'a', label: 'A', position: '0,0', appColumns: 3, appRows: 1, apps: [] },
    { id: 'b', label: 'B', position: '220,0', appColumns: 3, appRows: 1, apps: [] },
  ]
  return {
    version: 2,
    title: 't',
    layout: { widthMode: 'preset', maxWidth: 1200 },
    appLayout: { size: 'medium' },
    appearance: { accent: '#fff', background: '#000' },
    panes,
    ...overrides,
  }
}

describe('layout/layoutContentCap', () => {
  it('layoutContentCapPx reads preset and custom caps', () => {
    expect(layoutContentCapPx(baseConfig())).toBe(1200)
    expect(
      layoutContentCapPx(
        baseConfig({ layout: { widthMode: 'custom', customWidth: 900 } }),
      ),
    ).toBe(900)
    expect(layoutContentCapPx(baseConfig({ layout: { widthMode: 'full' } }))).toBe(null)
  })

  it('shouldReorganize when cap shrinks and panes overflow new width', () => {
    const prev = baseConfig({ layout: { widthMode: 'preset', maxWidth: 1600 } })
    // Below NARROW_CANVAS_WIDTH_PX, effective tile preset is `small`, so extent uses small metrics.
    const next = baseConfig({ layout: { widthMode: 'preset', maxWidth: 380 } })
    expect(shouldReorganizePanesForNarrowerLayout(prev, next)).toBe(true)
  })

  it('should not reorganize when cap increases', () => {
    const prev = baseConfig({ layout: { widthMode: 'preset', maxWidth: 800 } })
    const next = baseConfig({ layout: { widthMode: 'preset', maxWidth: 2000 } })
    expect(shouldReorganizePanesForNarrowerLayout(prev, next)).toBe(false)
  })

  it('should not reorganize when switching to full width', () => {
    const prev = baseConfig({ layout: { widthMode: 'preset', maxWidth: 800 } })
    const next = baseConfig({ layout: { widthMode: 'full' } })
    expect(shouldReorganizePanesForNarrowerLayout(prev, next)).toBe(false)
  })
})
