export type TileSizePreset = 'small' | 'medium' | 'large'
export type WidthMode = 'preset' | 'custom' | 'full'

export interface AppItem {
  id: string
  name: string
  position: string // "col,row"
  url: string
  icon: string
  iconStyle?: string
  iconColor?: string
  openInNewTab?: boolean
}

export interface PaneItem {
  id: string
  label: string
  position: string // "x,y"
  appColumns: number
  appRows: number
  apps: AppItem[]
}

export interface DashboardConfig {
  version: number
  title: string
  layout: {
    widthMode: WidthMode
    maxWidth?: number
    customWidth?: number
  }
  appLayout: {
    size: TileSizePreset
  }
  appearance: {
    accent: string
    background: string
  }
  panes: PaneItem[]
}

