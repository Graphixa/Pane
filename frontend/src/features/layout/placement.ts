import type { PaneItem, TileSizePreset } from '../config/types'
import { formatCoordPair } from '../../lib/coords'
import { isValidPanePlacement } from '../interaction/collision'
import { getAppColPitch, getAppRowPitch, getLayoutTokens } from './paneMath'

const PLACEHOLDER_PANE_ID = '__placement_new__'

const SEARCH_MAX_X = 3200
const SEARCH_MAX_Y = 2400

export function findNextPaneGridPosition(
  panes: PaneItem[],
  appSize: TileSizePreset,
  newPane: Pick<PaneItem, 'appColumns' | 'appRows'>,
  opts?: { maxContentWidthPx?: number },
): { x: number; y: number } {
  const tokens = getLayoutTokens(appSize)
  const stepX = getAppColPitch(tokens)
  const stepY = getAppRowPitch(tokens)
  const temp: PaneItem = {
    id: PLACEHOLDER_PANE_ID,
    label: 'New',
    position: '0,0',
    appColumns: newPane.appColumns,
    appRows: newPane.appRows,
    apps: [],
  }

  for (let y = 0; y < SEARCH_MAX_Y; y += stepY) {
    for (let x = 0; x < SEARCH_MAX_X; x += stepX) {
      const panesWith = [...panes, { ...temp, position: formatCoordPair(x, y) }]
      if (
        isValidPanePlacement({
          panes: panesWith,
          appSize,
          paneId: PLACEHOLDER_PANE_ID,
          x,
          y,
          maxContentWidthPx: opts?.maxContentWidthPx,
        })
      ) {
        return { x, y }
      }
    }
  }
  return { x: 0, y: 0 }
}

export function findFirstFreeAppCell(
  apps: { position: string }[],
  cols: number,
  rows: number,
): { col: number; row: number } | null {
  const taken = new Set(apps.map((a) => a.position))
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${col},${row}`
      if (!taken.has(key)) return { col, row }
    }
  }
  return null
}
