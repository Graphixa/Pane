import { useMemo, useRef } from 'react'
import type React from 'react'
import type { AppItem, PaneItem } from '../../features/config/types'
import { getAppRenderPosition } from '../../features/layout/paneMath'
import type { LayoutTokens, PaneMetrics } from '../../features/layout/paneMath'
import { parseCoordPair } from '../../lib/coords'

import AppTile from './AppTile'

export default function PaneCard(props: {
  pane: PaneItem
  tokens: LayoutTokens
  paneLeft: number
  paneTop: number
  metrics: PaneMetrics
  editMode: boolean
  onPaneDragStart: (pane: PaneItem, event: React.PointerEvent<HTMLDivElement>) => void
  onResizeStart: (
    pane: PaneItem,
    edge: 'right' | 'bottom' | 'bottom-right',
    event: React.PointerEvent<HTMLButtonElement>,
  ) => void
  onAppDragStart: (
    pane: PaneItem,
    app: AppItem,
    contentRect: DOMRect,
    event: React.PointerEvent<HTMLElement>,
  ) => void
  onDeletePane: (paneId: string) => Promise<void>
  onDeleteApp: (paneId: string, appId: string) => Promise<void>
  dragState?: { active: boolean; validDrop: boolean }
  resizeState?: { active: boolean; validDrop: boolean }
  appDragState?: { appId: string; previewCol: number; previewRow: number; collidedAppId?: string }
}) {
  const { pane, tokens, paneLeft, paneTop, metrics } = props
  const isActive = Boolean(props.dragState?.active || props.resizeState?.active)
  const isInvalid =
    props.dragState?.validDrop === false || props.resizeState?.validDrop === false

  const contentRef = useRef<HTMLDivElement | null>(null)

  const appDrag = props.appDragState
  const draggedApp = appDrag ? pane.apps.find((a) => a.id === appDrag.appId) : undefined
  const previewPositionByAppId = useMemo(() => {
    if (!appDrag) return null
    return new Map([[appDrag.appId, { col: appDrag.previewCol, row: appDrag.previewRow }]])
  }, [appDrag])

  return (
    <div
      className="absolute rounded-2xl border bg-white/5 backdrop-blur transition-all"
      style={{
        left: paneLeft,
        top: paneTop,
        width: metrics.paneWidth,
        height: metrics.paneHeight,
        borderColor: isInvalid ? 'rgba(248,113,113,0.8)' : 'rgba(255,255,255,0.1)',
        opacity: isActive ? 0.9 : 1,
        boxShadow: isActive
          ? '0 0 0 1px rgba(255,255,255,0.2), 0 18px 40px rgba(0,0,0,0.35)'
          : '0 8px 22px rgba(0,0,0,0.25)',
      }}
    >
      <div
        className="flex items-center px-4 text-xs text-white/80"
        style={{ height: tokens.headerHeight }}
        onPointerDown={(event) => props.onPaneDragStart(pane, event)}
      >
        <span className="truncate">{pane.label}</span>
        {props.editMode ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] tracking-widest text-white/35">DRAG</span>
            <button
              type="button"
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] tracking-wide text-white/70 hover:bg-white/10"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={async () => {
                await props.onDeletePane(pane.id)
              }}
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={contentRef}
        className="relative"
        style={{
          left: tokens.panePaddingLeft,
          top: tokens.headerHeight + tokens.panePaddingTop,
          width: metrics.contentWidth,
          height: metrics.contentHeight,
          position: 'absolute',
        }}
      >
        {props.editMode ? (
          <div
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 1px, transparent 1px ${tokens.tileSize + tokens.tileGap}px),
repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0 1px, transparent 1px ${tokens.tileSize + tokens.tileGap}px)`,
              opacity: 0.35,
            }}
          />
        ) : null}
        {pane.apps.map((app: AppItem) => {
          const isDragged = appDrag?.appId === app.id
          const isSwapTarget = appDrag?.collidedAppId === app.id

          const override = previewPositionByAppId?.get(app.id)
          const [col, row] = override ? [override.col, override.row] : parseCoordPair(app.position)
          // Content container is positioned at (panePaddingLeft, contentTopInset),
          // so we convert absolute pane-relative coords into content-local coords.
          const { x, y } = getAppRenderPosition(col, row, tokens, 0, 0)
          const left = x - tokens.panePaddingLeft
          const top = y - (tokens.headerHeight + tokens.panePaddingTop)

          return (
            <AppTile
              key={app.id}
              app={app}
              left={left}
              top={top}
              tokens={tokens}
              disableLink={props.editMode}
              isDragged={isDragged}
              isSwapTarget={isSwapTarget}
              onPointerDown={(event) => {
                if (!props.editMode) return
                const el = contentRef.current
                if (!el) return
                event.preventDefault()
                props.onAppDragStart(pane, app, el.getBoundingClientRect(), event)
              }}
            />
          )
        })}

        {props.editMode ? (
          <div className="pointer-events-none absolute inset-0">
            {pane.apps.map((app) => {
              const [col, row] = parseCoordPair(app.position)
              const left = col * (tokens.tileSize + tokens.tileGap)
              const top = row * (tokens.tileSize + tokens.tileGap)
              return (
                <button
                  key={`${app.id}-delete`}
                  type="button"
                  className="pointer-events-auto absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-white/10 bg-black/50 text-[11px] text-white/75 backdrop-blur hover:bg-black/70"
                  style={{ left: left + tokens.tileSize - 10, top: top - 10 }}
                  onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    await props.onDeleteApp(pane.id, app.id)
                  }}
                  aria-label={`Delete ${app.name}`}
                >
                  ×
                </button>
              )
            })}
          </div>
        ) : null}

        {draggedApp ? (
          <div
            className="pointer-events-none absolute rounded-xl border border-white/20 bg-white/10 backdrop-blur"
            style={{
              left: appDrag!.previewCol * (tokens.tileSize + tokens.tileGap),
              top: appDrag!.previewRow * (tokens.tileSize + tokens.tileGap),
              width: tokens.tileSize,
              height: tokens.tileSize,
              boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
            }}
          />
        ) : null}
      </div>

      {props.editMode ? (
        <>
          <button
            type="button"
            className="absolute -right-1.5 top-1/2 h-10 w-3 -translate-y-1/2 rounded bg-white/15 hover:bg-white/25"
            aria-label={`Resize ${pane.label} width`}
            onPointerDown={(event) => props.onResizeStart(pane, 'right', event)}
          />
          <button
            type="button"
            className="absolute bottom-[-6px] left-1/2 h-3 w-10 -translate-x-1/2 rounded bg-white/15 hover:bg-white/25"
            aria-label={`Resize ${pane.label} height`}
            onPointerDown={(event) => props.onResizeStart(pane, 'bottom', event)}
          />
          <button
            type="button"
            className="absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded bg-white/30 hover:bg-white/45"
            aria-label={`Resize ${pane.label}`}
            onPointerDown={(event) => props.onResizeStart(pane, 'bottom-right', event)}
          />
        </>
      ) : null}
    </div>
  )
}

