export interface PointerPoint {
  x: number
  y: number
}

export interface PointerSession {
  pointerId: number
  start: PointerPoint
  current: PointerPoint
  delta: PointerPoint
}

export type ActiveInteraction =
  | { type: 'none' }
  | {
      type: 'pane-drag'
      paneId: string
      session: PointerSession
      startLeftPx: number
      startTopPx: number
      previewLeftPx: number
      previewTopPx: number
      spanX: number
      spanY: number
      validDrop: boolean
    }
  | {
      type: 'pane-resize'
      paneId: string
      session: PointerSession
      edge: 'right' | 'bottom' | 'bottom-right'
      startColumns: number
      startRows: number
      previewColumns: number
      previewRows: number
      validDrop: boolean
    }
  | {
      type: 'app-drag'
      paneId: string
      appId: string
      session: PointerSession
      // contentRect is in viewport/client coordinates.
      contentRectLeft: number
      contentRectTop: number
      pickupOffsetX: number
      pickupOffsetY: number
      appColumns: number
      appRows: number
      startCol: number
      startRow: number
      previewCol: number
      previewRow: number
      collidedAppId?: string
    }

