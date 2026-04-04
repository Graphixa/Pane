import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type React from 'react'
import type { AppItem, PaneItem } from '../../features/config/types'
import { selfhstIconSvgUrl } from '../../features/icons/selfhst'
import { getAppColPitchDistributed, getAppRowPitch, getPaneInnerTileWidth } from '../../features/layout/paneMath'
import type { LayoutTokens, PaneMetrics } from '../../features/layout/paneMath'
import { parseCoordPairSafe } from '../../lib/coords'
import { shouldIgnorePaneDragTarget } from '../../lib/paneDragTarget'

import AppTile from './AppTile'

const floatIconShellClass =
  'flex shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.35)] backdrop-blur'

function FloatingAppDragPreview(props: {
  app: AppItem
  tokens: LayoutTokens
  clientX: number
  clientY: number
  pickupOffsetX: number
  pickupOffsetY: number
}) {
  const { app, tokens } = props
  const [iconFailed, setIconFailed] = useState(false)

  useEffect(() => {
    setIconFailed(false)
  }, [app.icon])

  const iconUrl = app.icon.trim() ? selfhstIconSvgUrl(app.icon) : null
  const showIcon = Boolean(iconUrl && !iconFailed)

  return createPortal(
    <div
      className="pointer-events-none fixed z-[200]"
      style={{
        left: props.clientX - props.pickupOffsetX,
        top: props.clientY - props.pickupOffsetY,
        width: tokens.tileSize,
      }}
    >
      <div
        className={floatIconShellClass}
        style={{
          width: tokens.tileSize,
          height: tokens.tileSize,
        }}
      >
        {showIcon ? (
          <img
            src={iconUrl!}
            alt=""
            className="pointer-events-none object-contain"
            style={{
              width: Math.max(0, tokens.tileSize - 8),
              height: Math.max(0, tokens.tileSize - 8),
            }}
            draggable={false}
            onError={() => setIconFailed(true)}
          />
        ) : null}
      </div>
      <div
        className="mt-0 w-full overflow-hidden text-center text-[10px] leading-snug text-white/85 line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
        style={{ marginTop: tokens.iconLabelGap, height: tokens.labelBandHeight }}
      >
        {app.name}
      </div>
    </div>,
    document.body,
  )
}

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
  /** Live grid size (e.g. while resizing); placeholders and pitches follow this. */
  gridColumns: number
  gridRows: number
  tokens: LayoutTokens
  paneLeft: number
  paneTop: number
  metrics: PaneMetrics
  /** When true, pane participates in flex reflow rows (no absolute left/top). */
  flowLayout?: boolean
  editMode: boolean
  /** When true (wrapped/narrow layout), pane drag, resize, and app reorder are disabled. */
  interactionLocked?: boolean
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
  appDragState?: {
    appId: string
    previewCol: number
    previewRow: number
    collidedAppId?: string
    clientX: number
    clientY: number
    pickupOffsetX: number
    pickupOffsetY: number
  }
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
  const { gridColumns, gridRows } = props

  const innerTileW = getPaneInnerTileWidth(metrics, tokens)
  const colPitch = getAppColPitchDistributed(tokens, gridColumns, innerTileW)
  const rowPitch = getAppRowPitch(tokens)

  function onPanePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!props.editMode || props.interactionLocked) return
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
    const draggedId = appDrag?.appId
    const slots: Array<{ col: number; row: number }> = []
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridColumns; col++) {
        const pos = `${col},${row}`
        const occupied = pane.apps.some((a) => {
          if (draggedId && a.id === draggedId) return false
          return a.position === pos
        })
        if (!occupied) slots.push({ col, row })
      }
    }
    return slots
  }, [props.editMode, gridRows, gridColumns, pane.apps, appDrag?.appId])

  const flow = Boolean(props.flowLayout)

  return (
    <div
      ref={rootRef}
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white/5 backdrop-blur transition-all ${flow ? 'relative shrink-0' : 'absolute'}`}
      style={{
        ...(flow ? {} : { left: paneLeft, top: paneTop }),
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
      {props.editMode ? (
        <div
          className="relative grid w-full shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 px-3 text-xs text-white/80"
          style={{ height: tokens.headerHeight }}
        >
          <div className="min-w-0" data-pane-no-drag>
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
          </div>
          <div
            className="pointer-events-none relative z-10 flex shrink-0 justify-center text-white/45"
            aria-hidden
          >
            <DragGripIcon />
          </div>
          <div className="flex min-w-0 justify-end" data-pane-no-drag>
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
        </div>
      ) : (
        <div
          className="flex min-h-0 shrink-0 items-center px-3 text-xs text-white/80"
          style={{ height: tokens.headerHeight }}
        >
          <span className="block min-w-0 truncate">{pane.label}</span>
        </div>
      )}

      <div className="relative min-h-0 w-full flex-1">
        <div
          ref={contentRef}
          className="absolute left-0 top-0"
          style={{
            width: metrics.renderPaneWidth,
            height: metrics.contentHeight,
          }}
        >
        {props.editMode ? (
          <div
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 1px, transparent 1px ${rowPitch}px),
repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0 1px, transparent 1px ${colPitch}px)`,
              opacity: 0.35,
            }}
          />
        ) : null}

        {emptySlots.map(({ col, row }) => {
          const left = tokens.gridInsetX + col * colPitch
          const top = tokens.gridInsetY + row * rowPitch
          return (
            <div
              key={`slot-${col}-${row}`}
              className="pointer-events-auto absolute z-0 rounded-xl border border-dashed border-white/18 bg-white/[0.02]"
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
          if (isDragged) return null

          const coords = parseCoordPairSafe(app.position)
          if (!coords) return null
          const [col, row] = coords
          const left = tokens.gridInsetX + col * colPitch
          const top = tokens.gridInsetY + row * rowPitch

          return (
            <AppTile
              key={app.id}
              app={app}
              left={left}
              top={top}
              tokens={tokens}
              disableLink={props.editMode}
              isDragged={false}
              isSwapTarget={isSwapTarget}
              onPointerDown={(event) => {
                if (!props.editMode || props.interactionLocked) return
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
              if (appDrag?.appId === app.id) return null
              const coords = parseCoordPairSafe(app.position)
              if (!coords) return null
              const [col, row] = coords
              const left = tokens.gridInsetX + col * colPitch
              const top = tokens.gridInsetY + row * rowPitch
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

        {draggedApp && appDrag ? (
          <div
            className="pointer-events-none absolute z-[2] rounded-xl ring-2 ring-sky-400/75 ring-offset-0"
            style={{
              left: tokens.gridInsetX + appDrag.previewCol * colPitch,
              top: tokens.gridInsetY + appDrag.previewRow * rowPitch,
              width: tokens.tileSize,
              height: tokens.tileSize,
              background: 'rgba(56,189,248,0.12)',
            }}
          />
        ) : null}
        </div>
      </div>

      {draggedApp && appDrag ? (
        <FloatingAppDragPreview
          app={draggedApp}
          tokens={tokens}
          clientX={appDrag.clientX}
          clientY={appDrag.clientY}
          pickupOffsetX={appDrag.pickupOffsetX}
          pickupOffsetY={appDrag.pickupOffsetY}
        />
      ) : null}

      {props.editMode && !props.interactionLocked ? (
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
