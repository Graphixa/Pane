import { useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import type { AppItem, PaneItem } from '../../features/config/types'
import { getAppRenderPosition } from '../../features/layout/paneMath'
import type { LayoutTokens, PaneMetrics } from '../../features/layout/paneMath'
import { parseCoordPair } from '../../lib/coords'
import { shouldIgnorePaneDragTarget } from '../../lib/paneDragTarget'

import AppTile from './AppTile'

function DragGripIcon() {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="currentColor" aria-hidden>
      <circle cx="4" cy="2.5" r="1.35" />
      <circle cx="10" cy="2.5" r="1.35" />
      <circle cx="16" cy="2.5" r="1.35" />
      <circle cx="4" cy="7.5" r="1.35" />
      <circle cx="10" cy="7.5" r="1.35" />
      <circle cx="16" cy="7.5" r="1.35" />
    </svg>
  )
}

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
  onRenamePane: (paneId: string, label: string) => Promise<void>
  onRequestAddAppAt?: (paneId: string, col: number, row: number) => void
  dragState?: { active: boolean; validDrop: boolean }
  resizeState?: { active: boolean; validDrop: boolean }
  appDragState?: { appId: string; previewCol: number; previewRow: number; collidedAppId?: string }
}) {
  const { pane, tokens, paneLeft, paneTop, metrics } = props
  const isActive = Boolean(props.dragState?.active || props.resizeState?.active)
  const isInvalid =
    props.dragState?.validDrop === false || props.resizeState?.validDrop === false

  const rootRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [labelEdit, setLabelEdit] = useState(pane.label)

  useEffect(() => {
    setLabelEdit(pane.label)
  }, [pane.label])

  const appDrag = props.appDragState
  const draggedApp = appDrag ? pane.apps.find((a) => a.id === appDrag.appId) : undefined
  const previewPositionByAppId = useMemo(() => {
    if (!appDrag) return null
    return new Map([[appDrag.appId, { col: appDrag.previewCol, row: appDrag.previewRow }]])
  }, [appDrag])

  const tileStep = tokens.tileSize + tokens.tileGap

  function onPanePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!props.editMode) return
    if (shouldIgnorePaneDragTarget(event.target)) return
    event.preventDefault()
    const root = rootRef.current
    if (root) {
      try {
        root.setPointerCapture(event.pointerId)
      } catch {
        /* capture may fail for disconnected nodes */
      }
    }
    props.onPaneDragStart(pane, event)
  }

  const emptySlots = useMemo(() => {
    if (!props.editMode) return []
    const slots: Array<{ col: number; row: number }> = []
    for (let row = 0; row < pane.appRows; row++) {
      for (let col = 0; col < pane.appColumns; col++) {
        const pos = `${col},${row}`
        if (!pane.apps.some((a) => a.position === pos)) {
          slots.push({ col, row })
        }
      }
    }
    return slots
  }, [props.editMode, pane.appRows, pane.appColumns, pane.apps])

  return (
    <div
      ref={rootRef}
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
      onPointerDown={onPanePointerDown}
    >
      <div
        className="relative flex min-h-0 items-center px-4 text-xs text-white/80"
        style={{ height: tokens.headerHeight }}
      >
        <div className="min-w-0 flex-1 pr-12" data-pane-no-drag>
          {props.editMode ? (
            <input
              className="w-full bg-transparent text-xs text-white/90 outline-none ring-0 placeholder:text-white/35 focus:border-b focus:border-white/20"
              value={labelEdit}
              aria-label="Pane name"
              onChange={(e) => setLabelEdit(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              onBlur={async () => {
                const t = labelEdit.trim()
                if (!t) {
                  setLabelEdit(pane.label)
                  return
                }
                if (t !== pane.label) {
                  await props.onRenamePane(pane.id, t)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
            />
          ) : (
            <span className="block truncate">{pane.label}</span>
          )}
        </div>
        {props.editMode ? (
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40"
            aria-hidden
          >
            <DragGripIcon />
          </div>
        ) : null}
        {props.editMode ? (
          <div className="ml-auto flex shrink-0 items-center gap-2" data-pane-no-drag>
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

        {emptySlots.map(({ col, row }) => {
          const left = col * tileStep
          const top = row * tileStep
          return (
            <div
              key={`slot-${col}-${row}`}
              className="pointer-events-auto absolute rounded-xl border border-dashed border-white/18 bg-white/[0.02]"
              style={{
                left,
                top,
                width: tokens.tileSize,
                height: tokens.tileSize,
              }}
            >
              {props.onRequestAddAppAt ? (
                <button
                  type="button"
                  data-pane-no-drag
                  className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-lg border border-white/15 bg-black/40 text-sm text-white/60 backdrop-blur hover:border-white/25 hover:text-white/85"
                  title="Add app in this slot"
                  aria-label="Add app in this slot"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => props.onRequestAddAppAt!(pane.id, col, row)}
                >
                  +
                </button>
              ) : null}
            </div>
          )
        })}

        {pane.apps.map((app: AppItem) => {
          const isDragged = appDrag?.appId === app.id
          const isSwapTarget = appDrag?.collidedAppId === app.id

          const override = previewPositionByAppId?.get(app.id)
          const [col, row] = override ? [override.col, override.row] : parseCoordPair(app.position)
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
                  data-pane-no-drag
                  className="pointer-events-auto absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-white/10 bg-black/50 text-[11px] text-white/75 backdrop-blur hover:bg-black/70"
                  style={{ left: left + tokens.tileSize - 10, top: top - 10 }}
                  onPointerDown={(e) => e.stopPropagation()}
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
            data-pane-resize
            className="absolute -right-1.5 top-1/2 h-10 w-3 -translate-y-1/2 rounded bg-white/15 hover:bg-white/25"
            aria-label={`Resize ${pane.label} width`}
            onPointerDown={(event) => props.onResizeStart(pane, 'right', event)}
          />
          <button
            type="button"
            data-pane-resize
            className="absolute bottom-[-6px] left-1/2 h-3 w-10 -translate-x-1/2 rounded bg-white/15 hover:bg-white/25"
            aria-label={`Resize ${pane.label} height`}
            onPointerDown={(event) => props.onResizeStart(pane, 'bottom', event)}
          />
          <button
            type="button"
            data-pane-resize
            className="absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded bg-white/30 hover:bg-white/45"
            aria-label={`Resize ${pane.label}`}
            onPointerDown={(event) => props.onResizeStart(pane, 'bottom-right', event)}
          />
        </>
      ) : null}
    </div>
  )
}
