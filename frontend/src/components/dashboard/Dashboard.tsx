import { useDashboardConfig } from '../../hooks/useDashboardConfig'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useElementWidth } from '../../hooks/useElementWidth'
import { updateDashboardConfig } from '../../features/config/api'
import { createApp } from '../../features/apps/api'
import type { AppItem, DashboardConfig, PaneItem, TileSizePreset } from '../../features/config/types'
import { fixDashboardLayout } from '../../features/layout/fixDashboardLayout'
// Pane reorg confirm happens inside SettingsPanel.
import { evaluateNarrowPersistTriggers } from '../../features/layout/narrowLayoutPersist'
import { findNextPaneGridPosition } from '../../features/layout/placement'
import { needsDashboardReflow } from '../../features/layout/reflowPresentation'
import { getEffectiveTileSizeForCanvasWidth } from '../../features/layout/viewportLayout'
import { createPane } from '../../features/panes/api'
import { formatCoordPair } from '../../lib/coords'
import DashboardGrid from './DashboardGrid'
import { AddAppModal, AddPaneModal } from './AddEntityModals'

import type React from 'react'
import SettingsPanel from '../settings/SettingsPanel'

export default function Dashboard(props: { initialConfig?: DashboardConfig }) {
  const query = useDashboardConfig()
  const [editMode, setEditMode] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [paneModalOpen, setPaneModalOpen] = useState(false)
  const [appModalOpen, setAppModalOpen] = useState(false)
  const [appModalPreset, setAppModalPreset] = useState<{
    paneId: string
    col: number
    row: number
  } | null>(null)
  const addMenuRef = useRef<HTMLDivElement | null>(null)
  const [canvasEl, setCanvasEl] = useState<HTMLDivElement | null>(null)
  const canvasContentWidth = useElementWidth(canvasEl)

  useEffect(() => {
    if (!addMenuOpen) return
    function onDocMouseDown(e: MouseEvent) {
      if (addMenuRef.current?.contains(e.target as Node)) return
      setAddMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [addMenuOpen])

  const cfg = props.initialConfig ?? query.data
  const bg = cfg?.appearance?.background ?? '#0F1115'
  const accent = cfg?.appearance?.accent ?? '#3B82F6'

  const shellStyle = useMemo(() => {
    return {
      background: `radial-gradient(1200px 700px at 20% 10%, rgba(59,130,246,0.22), transparent 60%),
radial-gradient(900px 600px at 90% 20%, rgba(236,72,153,0.14), transparent 55%),
radial-gradient(1000px 800px at 50% 100%, rgba(34,197,94,0.10), transparent 60%),
linear-gradient(180deg, rgba(255,255,255,0.04), transparent 22%),
${bg}`,
      minHeight: 'max(100%, 100dvh)',
      paddingTop: 'max(0px, env(safe-area-inset-top, 0px))',
      paddingLeft: 'max(0px, env(safe-area-inset-left, 0px))',
      paddingRight: 'max(0px, env(safe-area-inset-right, 0px))',
      paddingBottom: 'max(0px, env(safe-area-inset-bottom, 0px))',
    } satisfies React.CSSProperties
  }, [bg])

  const lastCanvasWidthBaselineRef = useRef<number | null>(null)
  const lastEffectivePresetRef = useRef<TileSizePreset | null>(null)
  const initialOverflowPackDoneRef = useRef(false)
  const prevEditModeRef = useRef(editMode)

  useLayoutEffect(() => {
    if (!cfg || canvasContentWidth === undefined || canvasContentWidth <= 0) return

    const effectiveTileSize = getEffectiveTileSizeForCanvasWidth(
      canvasContentWidth,
      cfg.appLayout.size,
    )
    const overflow = needsDashboardReflow(cfg, canvasContentWidth, effectiveTileSize)

    if (!overflow) {
      lastCanvasWidthBaselineRef.current = canvasContentWidth
      lastEffectivePresetRef.current = effectiveTileSize
      prevEditModeRef.current = editMode
      return
    }

    const enteredEditWhileOverflow = editMode && !prevEditModeRef.current && overflow

    const { shouldPack, markInitialOverflowHandled } = evaluateNarrowPersistTriggers({
      needsReflow: overflow,
      canvasWidth: canvasContentWidth,
      effectivePreset: effectiveTileSize,
      lastCanvasWidthBaseline: lastCanvasWidthBaselineRef.current,
      lastEffectivePreset: lastEffectivePresetRef.current,
      initialOverflowPackDone: initialOverflowPackDoneRef.current,
      shrinkOnAnyWidthDecrease: editMode,
    })

    if (markInitialOverflowHandled) {
      initialOverflowPackDoneRef.current = true
    }

    if (shouldPack || enteredEditWhileOverflow) {
      const { config: next, changed } = fixDashboardLayout(
        cfg,
        canvasContentWidth,
        effectiveTileSize,
      )
      if (changed) {
        const previous = query.data
        flushSync(() => {
          query.mutate(next, { revalidate: false })
        })
        void (async () => {
          try {
            await updateDashboardConfig(next)
          } catch {
            if (previous) {
              flushSync(() => {
                query.mutate(previous, { revalidate: false })
              })
            }
          }
        })()
      }
    }

    lastCanvasWidthBaselineRef.current = canvasContentWidth
    lastEffectivePresetRef.current = effectiveTileSize
    prevEditModeRef.current = editMode
  }, [cfg, canvasContentWidth, editMode, query])

  if (query.error) {
    return (
      <div className="p-6 text-sm text-red-200">
        Failed to load config: {String(query.error.message ?? query.error)}
      </div>
    )
  }

  if (!cfg) {
    return <div className="p-6 text-sm text-white/70">Loading...</div>
  }

  const dashboard = cfg

  async function handleAddPane(label: string) {
    const id = `pane-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`
    const placementTileSize = getEffectiveTileSizeForCanvasWidth(
      canvasContentWidth,
      dashboard.appLayout.size,
    )
    const pos = findNextPaneGridPosition(
      dashboard.panes,
      placementTileSize,
      {
        appColumns: 3,
        appRows: 1,
      },
      canvasContentWidth !== undefined && canvasContentWidth > 0
        ? { maxContentWidthPx: canvasContentWidth }
        : undefined,
    )
    const newPane: PaneItem = {
      id,
      label,
      position: formatCoordPair(pos.x, pos.y),
      appColumns: 3,
      appRows: 1,
      apps: [],
    }
    const previous = query.data
    const optimistic: DashboardConfig = { ...dashboard, panes: [...dashboard.panes, newPane] }
    await query.mutate(optimistic, { revalidate: false })
    try {
      const fromServer = await createPane(newPane)
      await query.mutate(fromServer, { revalidate: false })
    } catch (error) {
      if (previous) {
        await query.mutate(previous, { revalidate: false })
      }
      throw error
    }
  }

  async function handleAddApp(input: {
    paneId: string
    name: string
    url: string
    icon: string
    position: string
    openInNewTab: boolean
  }) {
    const appId = `app-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`
    const newApp: AppItem = {
      id: appId,
      name: input.name,
      url: input.url,
      position: input.position,
      icon: input.icon,
      openInNewTab: input.openInNewTab,
    }
    const previous = query.data
    const nextPanes = dashboard.panes.map((p) =>
      p.id === input.paneId ? { ...p, apps: [...p.apps, newApp] } : p,
    )
    const optimistic: DashboardConfig = { ...dashboard, panes: nextPanes }
    await query.mutate(optimistic, { revalidate: false })
    try {
      const fromServer = await createApp(input.paneId, newApp)
      await query.mutate(fromServer, { revalidate: false })
    } catch (error) {
      if (previous) {
        await query.mutate(previous, { revalidate: false })
      }
      throw error
    }
  }

  return (
    <div className="pane-grain flex h-full min-h-0 w-full flex-col text-white" style={shellStyle}>
      <div className="flex min-h-0 h-full flex-1 flex-col">
        <header className="flex items-center justify-between px-4 py-4">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/55">
              Pane
            </div>
            <div className="truncate text-[15px] font-medium text-white/90">
              {cfg.title}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={addMenuRef}>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-lg leading-none text-white/85 backdrop-blur hover:bg-white/10"
                aria-expanded={addMenuOpen}
                aria-haspopup="menu"
                title="Add"
                onClick={(e) => {
                  e.stopPropagation()
                  setAddMenuOpen((v) => !v)
                }}
              >
                +
              </button>
              {addMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 min-w-[180px] rounded-xl border border-white/10 bg-[#0c1018]/95 py-1 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-xs text-white/85 hover:bg-white/10"
                    onClick={() => {
                      setAddMenuOpen(false)
                      setPaneModalOpen(true)
                    }}
                  >
                    Add pane
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-xs text-white/85 hover:bg-white/10"
                    onClick={() => {
                      setAddMenuOpen(false)
                      setAppModalPreset(null)
                      setAppModalOpen(true)
                    }}
                  >
                    Add app
                  </button>
                  <div className="px-3 py-2 text-[11px] text-white/35">Add widget — soon</div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur hover:bg-white/10"
              onClick={() => setSettingsOpen(true)}
            >
              Settings
            </button>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur hover:bg-white/10"
              style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 10px 25px rgba(0,0,0,0.25)` }}
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? 'Done' : 'Edit'}
            </button>
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: accent, boxShadow: `0 0 0 3px rgba(255,255,255,0.06), 0 0 26px ${accent}` }}
              aria-hidden="true"
            />
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden px-4 pb-4">
          <div
            ref={setCanvasEl}
            className="box-border h-full min-h-0 w-full max-w-full flex-1 overflow-x-hidden rounded-2xl border border-white/10 bg-black/10 backdrop-blur"
            style={{
              maxWidth:
                cfg.layout.widthMode === 'full'
                  ? undefined
                  : cfg.layout.widthMode === 'custom'
                    ? `${cfg.layout.customWidth ?? 1200}px`
                    : `${cfg.layout.maxWidth ?? 1200}px`,
              marginInline: 'auto',
            }}
          >
            <DashboardGrid
              config={cfg}
              editMode={editMode}
              containerContentWidth={canvasContentWidth}
              onRequestAddAppAt={(paneId, col, row) => {
                setAppModalPreset({ paneId, col, row })
                setAppModalOpen(true)
              }}
              onCommitConfig={async (next) => {
                const previous = query.data
                await query.mutate(next, { revalidate: false })
                try {
                  await updateDashboardConfig(next)
                } catch (error) {
                  // Roll back optimistic cache on persistence failure.
                  if (previous) {
                    await query.mutate(previous, { revalidate: false })
                  }
                  throw error
                }
              }}
              onCommitConfigFromServer={async (nextFromServer) => {
                await query.mutate(nextFromServer, { revalidate: false })
              }}
            />
          </div>
        </main>
      </div>

      <AddPaneModal
        open={paneModalOpen}
        onClose={() => setPaneModalOpen(false)}
        onSubmit={handleAddPane}
      />
      <AddAppModal
        open={appModalOpen}
        panes={cfg.panes}
        preferredPaneId={cfg.panes[0]?.id}
        presetSlot={appModalPreset ?? undefined}
        onClose={() => {
          setAppModalOpen(false)
          setAppModalPreset(null)
        }}
        onSubmit={handleAddApp}
      />

      {settingsOpen ? (
        <SettingsPanel
          config={cfg}
          onClose={() => setSettingsOpen(false)}
          onSave={async (next) => {
            const previous = query.data
            await query.mutate(next, { revalidate: false })
            try {
              await updateDashboardConfig(next)
            } catch (error) {
              if (previous) {
                await query.mutate(previous, { revalidate: false })
              }
              throw error
            }
            return true
          }}
        />
      ) : null}
    </div>
  )
}

