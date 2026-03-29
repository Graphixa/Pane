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

/** Preset mode: max-width cap on large screens. */
const PRESET_MAX_MIN = 640
const PRESET_MAX_MAX = 4000

/** Custom mode: fixed pixel width. */
const CUSTOM_WIDTH_MIN = 640
const CUSTOM_WIDTH_MAX = 5000

/**
 * Ordered breakpoint stops for stepped sliders (single source of truth).
 * Preset max-width uses entries ≤ PRESET_MAX_MAX; custom width uses the full list in range.
 */
const WIDTH_BREAKPOINT_STOPS = [
  640, 768, 800, 960, 1024, 1200, 1280, 1366, 1440, 1520, 1600, 1920, 2560, 3200, 3840, 5000,
] as const

const PRESET_SLIDER_STOPS: readonly number[] = WIDTH_BREAKPOINT_STOPS.filter((w) => w <= PRESET_MAX_MAX)

const CUSTOM_SLIDER_STOPS: readonly number[] = WIDTH_BREAKPOINT_STOPS.filter(
  (w) => w >= CUSTOM_WIDTH_MIN && w <= CUSTOM_WIDTH_MAX,
)

function clampWidth(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.round(n)))
}

function nearestStopIndex(width: number, stops: readonly number[]): number {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < stops.length; i++) {
    const d = Math.abs(stops[i] - width)
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

function NumericWidthField(props: {
  value: number
  onCommit: (n: number) => void
  min: number
  max: number
  disabled?: boolean
  id?: string
  'aria-label'?: string
}) {
  const [text, setText] = useState(() => String(props.value))

  return (
    <div className="relative">
      <input
        id={props.id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        disabled={props.disabled}
        aria-label={props['aria-label']}
        className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-3 pr-10 font-[family-name:'JetBrains_Mono',ui-monospace,monospace] text-sm tabular-nums tracking-tight text-white/90 outline-none transition-[border-color,box-shadow] focus:border-white/25 focus:ring-1 focus:ring-white/15 disabled:cursor-not-allowed disabled:opacity-45"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const raw = text.trim()
          if (raw === '') {
            setText(String(props.value))
            return
          }
          const digits = raw.replace(/[^\d]/g, '')
          if (!digits) {
            setText(String(props.value))
            return
          }
          const n = Number.parseInt(digits, 10)
          if (!Number.isFinite(n)) {
            setText(String(props.value))
            return
          }
          const next = clampWidth(n, props.min, props.max)
          props.onCommit(next)
          setText(String(next))
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/40">
        px
      </span>
    </div>
  )
}

function LayoutStepSlider(props: {
  stops: readonly number[]
  valuePx: number
  accentColor: string
  ariaLabel: string
  heading: string
  onPickStop: (w: number) => void
}) {
  const { stops, valuePx, accentColor } = props
  const idx = nearestStopIndex(valuePx, stops)
  const atStop = stops[idx]!

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/38">
          {props.heading}
        </span>
        <span className="font-[family-name:'JetBrains_Mono',ui-monospace,monospace] text-xs tabular-nums text-white/70">
          {valuePx}px
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={stops.length - 1}
        step={1}
        className="w-full cursor-pointer"
        style={{ accentColor }}
        aria-label={props.ariaLabel}
        value={idx}
        onChange={(e) => {
          const i = clampWidth(
            Number.parseInt(e.target.value, 10),
            0,
            stops.length - 1,
          )
          props.onPickStop(stops[i]!)
        }}
        aria-valuetext={`${atStop} pixels (nearest stop to current ${valuePx})`}
      />
      <div className="mt-1 flex justify-between font-[family-name:'JetBrains_Mono',ui-monospace,monospace] text-[9px] tabular-nums text-white/35">
        <span>{stops[0]}</span>
        <span>{stops[stops.length - 1]}</span>
      </div>
    </div>
  )
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

      <div
        className="absolute right-4 top-4 bottom-4 w-[520px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#0c1018]/90 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur"
        style={{ fontFamily: "'Instrument Sans', ui-sans-serif, system-ui, sans-serif" }}
      >
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
              <section className="space-y-6">
                <div>
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
                    Tile size
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['small', 'medium', 'large'] as const).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={[
                          'rounded-xl border px-3.5 py-2 text-xs font-medium capitalize transition-colors',
                          draft.appLayout.size === preset
                            ? 'border-white/22 bg-white/11 text-white'
                            : 'border-white/10 bg-white/[0.04] text-white/65 hover:border-white/16 hover:bg-white/[0.08]',
                        ].join(' ')}
                        onClick={() => setTilePreset(preset)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

                <div>
                  <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
                    Dashboard width
                  </div>
                  <p className="mb-3 text-[13px] leading-relaxed text-white/55">
                    Choose how wide the dashboard content may grow. Only one mode applies at a time—controls below follow your selection.
                  </p>
                  <div
                    className="mb-4 inline-flex rounded-xl border border-white/10 bg-black/25 p-1"
                    role="tablist"
                    aria-label="Width mode"
                  >
                    {(['preset', 'custom', 'full'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        role="tab"
                        aria-selected={draft.layout.widthMode === mode}
                        className={[
                          'rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all',
                          draft.layout.widthMode === mode
                            ? 'bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                            : 'text-white/55 hover:text-white/80',
                        ].join(' ')}
                        onClick={() => setWidthMode(mode)}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {draft.layout.widthMode === 'preset' ? (
                    <div
                      className="space-y-4 rounded-2xl border border-white/[0.08] border-l-[3px] bg-gradient-to-b from-white/[0.04] to-transparent p-4"
                      style={{ borderLeftColor: draft.appearance.accent }}
                    >
                      <p className="text-[13px] leading-relaxed text-white/60">
                        On wide screens, content stays within a centered column capped at your max width. Pick a
                        common breakpoint, or set an exact value below.
                      </p>
                      <LayoutStepSlider
                        stops={PRESET_SLIDER_STOPS}
                        valuePx={draft.layout.maxWidth ?? 1200}
                        accentColor={draft.appearance.accent}
                        heading="Breakpoints"
                        ariaLabel="Step through max-width breakpoints"
                        onPickStop={(w) =>
                          setDraft((c) => ({
                            ...c,
                            layout: { ...c.layout, maxWidth: w },
                          }))
                        }
                      />
                      <div>
                        <label
                          htmlFor="preset-max-exact"
                          className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/38"
                        >
                          Manual entry
                        </label>
                        <NumericWidthField
                          key={`preset-max-${draft.layout.maxWidth ?? 1200}`}
                          id="preset-max-exact"
                          aria-label="Exact max width in pixels"
                          value={draft.layout.maxWidth ?? 1200}
                          min={PRESET_MAX_MIN}
                          max={PRESET_MAX_MAX}
                          onCommit={(n) =>
                            setDraft((c) => ({
                              ...c,
                              layout: { ...c.layout, maxWidth: n },
                            }))
                          }
                        />
                        <p className="mt-1.5 text-[11px] text-white/40">
                          Allowed {PRESET_MAX_MIN}–{PRESET_MAX_MAX}px. Value commits when you leave the field.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {draft.layout.widthMode === 'custom' ? (
                    <div
                      className="space-y-4 rounded-2xl border border-white/[0.08] border-l-[3px] bg-gradient-to-b from-white/[0.04] to-transparent p-4"
                      style={{ borderLeftColor: draft.appearance.accent }}
                    >
                      <p className="text-[13px] leading-relaxed text-white/60">
                        Fixed width in pixels. Snap the slider to a breakpoint, or type any width in range below.
                      </p>
                      <LayoutStepSlider
                        stops={CUSTOM_SLIDER_STOPS}
                        valuePx={draft.layout.customWidth ?? 1200}
                        accentColor={draft.appearance.accent}
                        heading="Breakpoints"
                        ariaLabel="Step through custom width breakpoints"
                        onPickStop={(w) =>
                          setDraft((c) => ({
                            ...c,
                            layout: { ...c.layout, customWidth: w },
                          }))
                        }
                      />
                      <div>
                        <label
                          htmlFor="custom-width-exact"
                          className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/38"
                        >
                          Manual entry
                        </label>
                        <NumericWidthField
                          key={`custom-w-${draft.layout.customWidth ?? 1200}`}
                          id="custom-width-exact"
                          aria-label="Exact custom width in pixels"
                          value={draft.layout.customWidth ?? 1200}
                          min={CUSTOM_WIDTH_MIN}
                          max={CUSTOM_WIDTH_MAX}
                          onCommit={(n) =>
                            setDraft((c) => ({
                              ...c,
                              layout: { ...c.layout, customWidth: n },
                            }))
                          }
                        />
                        <p className="mt-1.5 text-[11px] text-white/40">
                          {CUSTOM_WIDTH_MIN}–{CUSTOM_WIDTH_MAX}px. Does not need to match a slider stop.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {draft.layout.widthMode === 'full' ? (
                    <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-4 py-5 text-center">
                      <p className="text-[13px] leading-relaxed text-white/55">
                        The dashboard uses the full viewport width. Width and max-width settings are ignored until you
                        switch to preset or custom.
                      </p>
                    </div>
                  ) : null}
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
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
                  App icons are loaded from the{' '}
                  <a
                    className="text-sky-300/90 underline decoration-white/15 underline-offset-2 hover:text-sky-200"
                    href="https://github.com/selfhst/icons"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    selfhst/icons
                  </a>{' '}
                  collection (CC BY 4.0), served via jsDelivr.
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

