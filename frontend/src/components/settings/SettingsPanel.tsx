import { useMemo, useState } from 'react'

import type { DashboardConfig, TileSizePreset, WidthMode } from '../../features/config/types'

type TabId = 'general' | 'layout' | 'appearance' | 'background' | 'about'

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'layout', label: 'Layout' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'background', label: 'Background' },
  { id: 'about', label: 'About' },
]

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

export default function SettingsPanel(props: {
  config: DashboardConfig
  onClose: () => void
  onSave: (next: DashboardConfig) => Promise<void>
}) {
  const [tab, setTab] = useState<TabId>('general')
  const [draft, setDraft] = useState<DashboardConfig>(() => props.config)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(props.config), [draft, props.config])

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await props.onSave(draft)
      props.onClose()
    } catch (e) {
      setError(String((e as Error)?.message ?? e))
    } finally {
      setSaving(false)
    }
  }

  function setWidthMode(mode: WidthMode) {
    setDraft((c) => ({
      ...c,
      layout: {
        ...c.layout,
        widthMode: mode,
      },
    }))
  }

  function setTilePreset(size: TileSizePreset) {
    setDraft((c) => ({
      ...c,
      appLayout: { ...c.appLayout, size },
    }))
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={props.onClose} />

      <div className="absolute right-4 top-4 bottom-4 w-[520px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#0c1018]/90 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="text-sm font-medium text-white/90">Settings</div>
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10"
            onClick={props.onClose}
          >
            Esc
          </button>
        </div>

        <div className="flex h-full min-h-0">
          <nav className="w-40 shrink-0 border-r border-white/10 p-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={[
                  'w-full rounded-lg px-3 py-2 text-left text-xs transition-colors',
                  tab === t.id ? 'bg-white/10 text-white/90' : 'text-white/65 hover:bg-white/5 hover:text-white/85',
                ].join(' ')}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="min-w-0 flex-1 p-5">
            {error ? (
              <div className="mb-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                {error}
              </div>
            ) : null}

            {tab === 'general' ? (
              <section className="space-y-4">
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-white/45">
                    Title
                  </div>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/20"
                    value={draft.title}
                    onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))}
                    placeholder="Dashboard"
                  />
                </div>
              </section>
            ) : null}

            {tab === 'layout' ? (
              <section className="space-y-5">
                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-white/45">
                    Tile size preset
                  </div>
                  <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as const).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={[
                          'rounded-xl border px-3 py-2 text-xs',
                          draft.appLayout.size === preset
                            ? 'border-white/20 bg-white/10 text-white/90'
                            : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10',
                        ].join(' ')}
                        onClick={() => setTilePreset(preset)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-white/45">
                    Width mode
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['preset', 'custom', 'full'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={[
                          'rounded-xl border px-3 py-2 text-xs',
                          draft.layout.widthMode === mode
                            ? 'border-white/20 bg-white/10 text-white/90'
                            : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10',
                        ].join(' ')}
                        onClick={() => setWidthMode(mode)}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-white/45">
                      Max width (preset)
                    </div>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/20 disabled:opacity-50"
                      value={draft.layout.maxWidth ?? 1200}
                      disabled={draft.layout.widthMode !== 'preset'}
                      onChange={(e) => {
                        const n = clampInt(Number(e.target.value), 640, 4000)
                        setDraft((c) => ({ ...c, layout: { ...c.layout, maxWidth: n } }))
                      }}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-white/45">
                      Custom width
                    </div>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/20 disabled:opacity-50"
                      value={draft.layout.customWidth ?? 1200}
                      disabled={draft.layout.widthMode !== 'custom'}
                      onChange={(e) => {
                        const n = clampInt(Number(e.target.value), 640, 5000)
                        setDraft((c) => ({ ...c, layout: { ...c.layout, customWidth: n } }))
                      }}
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {tab === 'appearance' ? (
              <section className="space-y-4">
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-white/45">
                    Accent
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={draft.appearance.accent}
                      onChange={(e) =>
                        setDraft((c) => ({
                          ...c,
                          appearance: { ...c.appearance, accent: e.target.value },
                        }))
                      }
                      className="h-10 w-10 rounded-xl border border-white/10 bg-white/5"
                    />
                    <input
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/20"
                      value={draft.appearance.accent}
                      onChange={(e) =>
                        setDraft((c) => ({
                          ...c,
                          appearance: { ...c.appearance, accent: e.target.value },
                        }))
                      }
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {tab === 'background' ? (
              <section className="space-y-4">
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-white/45">
                    Background color
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={draft.appearance.background}
                      onChange={(e) =>
                        setDraft((c) => ({
                          ...c,
                          appearance: { ...c.appearance, background: e.target.value },
                        }))
                      }
                      className="h-10 w-10 rounded-xl border border-white/10 bg-white/5"
                    />
                    <input
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/20"
                      value={draft.appearance.background}
                      onChange={(e) =>
                        setDraft((c) => ({
                          ...c,
                          appearance: { ...c.appearance, background: e.target.value },
                        }))
                      }
                      placeholder="#0F1115"
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {tab === 'about' ? (
              <section className="space-y-3 text-sm text-white/80">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                  About
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-white/90">Pane</div>
                  <div className="mt-1 text-xs text-white/60">
                    Self-hosted dashboard. Config stored as YAML; UI derives layout deterministically.
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/20 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-white/50">
              {dirty ? 'Unsaved changes' : 'Up to date'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
                onClick={props.onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/90 hover:bg-white/15 disabled:opacity-60"
                onClick={save}
                disabled={!dirty || saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

