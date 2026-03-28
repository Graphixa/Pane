import { useDashboardConfig } from '../../hooks/useDashboardConfig'

import { useMemo, useState } from 'react'
import { updateDashboardConfig } from '../../features/config/api'
import type { DashboardConfig } from '../../features/config/types'
import DashboardGrid from './DashboardGrid'

import type React from 'react'
import SettingsPanel from '../settings/SettingsPanel'

export default function Dashboard(props: { initialConfig?: DashboardConfig }) {
  const query = useDashboardConfig()
  const [editMode, setEditMode] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const cfg = props.initialConfig ?? query.data
  const bg = cfg?.appearance?.background ?? '#0F1115'
  const accent = cfg?.appearance?.accent ?? '#3B82F6'

  const bgStyle = useMemo(() => {
    return {
      background: `radial-gradient(1200px 700px at 20% 10%, rgba(59,130,246,0.22), transparent 60%),
radial-gradient(900px 600px at 90% 20%, rgba(236,72,153,0.14), transparent 55%),
radial-gradient(1000px 800px at 50% 100%, rgba(34,197,94,0.10), transparent 60%),
linear-gradient(180deg, rgba(255,255,255,0.04), transparent 22%),
${bg}`,
    } satisfies React.CSSProperties
  }, [bg])

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

  return (
    <div className="pane-grain h-full w-full text-white" style={bgStyle}>
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between px-5 py-4">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/55">
              Pane
            </div>
            <div className="truncate text-[15px] font-medium text-white/90">
              {cfg.title}
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        <main className="min-h-0 flex-1 px-4 pb-4">
          <div
            className="h-full rounded-2xl border border-white/10 bg-black/10 backdrop-blur"
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
          }}
        />
      ) : null}
    </div>
  )
}

