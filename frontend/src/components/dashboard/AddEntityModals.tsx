import { useEffect, useMemo, useState } from 'react'
import type { PaneItem } from '../../features/config/types'
import { findFirstFreeAppCell } from '../../features/layout/placement'

export function AddPaneModal(props: {
  open: boolean
  onClose: () => void
  onSubmit: (label: string) => Promise<void>
}) {
  const [label, setLabel] = useState('New pane')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (props.open) {
      setLabel('New pane')
      setError(null)
      setBusy(false)
    }
  }, [props.open])

  if (!props.open) return null

  async function submit() {
    const trimmed = label.trim()
    if (!trimmed) {
      setError('Label is required')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await props.onSubmit(trimmed)
      props.onClose()
    } catch (e) {
      setError(String((e as Error)?.message ?? e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        aria-label="Close"
        onClick={props.onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1018]/95 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="text-sm font-medium text-white/90">Add pane</div>
        <p className="mt-1 text-xs text-white/55">Creates a pane with a 3×2 app grid at the next free dashboard slot.</p>
        {error ? (
          <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {error}
          </div>
        ) : null}
        <label className="mt-4 block text-[11px] uppercase tracking-[0.18em] text-white/45">
          Name
        </label>
        <input
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/20"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit()
          }}
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
            onClick={props.onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/90 hover:bg-white/15 disabled:opacity-50"
            onClick={() => void submit()}
            disabled={busy}
          >
            {busy ? 'Adding…' : 'Add pane'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AddAppModal(props: {
  open: boolean
  panes: PaneItem[]
  /** Default pane when opening from the + menu. */
  preferredPaneId?: string
  /** Set when user clicks an empty grid cell in edit mode. */
  presetSlot?: { paneId: string; col: number; row: number }
  onClose: () => void
  onSubmit: (input: {
    paneId: string
    name: string
    url: string
    icon: string
    position: string
    openInNewTab: boolean
  }) => Promise<void>
}) {
  const [paneId, setPaneId] = useState('')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('https://')
  const [icon, setIcon] = useState('')
  const [openInNewTab, setOpenInNewTab] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultPaneId = useMemo(() => {
    if (props.presetSlot?.paneId) return props.presetSlot.paneId
    if (props.preferredPaneId && props.panes.some((p) => p.id === props.preferredPaneId)) {
      return props.preferredPaneId
    }
    return props.panes[0]?.id ?? ''
  }, [props.preferredPaneId, props.panes, props.presetSlot?.paneId])

  useEffect(() => {
    if (props.open) {
      setPaneId(defaultPaneId)
      setName('')
      setUrl('https://')
      setIcon('')
      setOpenInNewTab(true)
      setError(null)
      setBusy(false)
    }
  }, [props.open, defaultPaneId])

  if (!props.open) return null

  const effectivePaneId = paneId || defaultPaneId
  const selectedPane = props.panes.find((p) => p.id === effectivePaneId)

  async function submit() {
    const trimmedName = name.trim()
    const trimmedUrl = url.trim()
    if (!effectivePaneId) {
      setError('Select a pane')
      return
    }
    if (!trimmedName) {
      setError('Name is required')
      return
    }
    if (!trimmedUrl) {
      setError('URL is required')
      return
    }
    let position: string
    if (props.presetSlot && selectedPane) {
      position = `${props.presetSlot.col},${props.presetSlot.row}`
      const taken = selectedPane.apps.some((a) => a.position === position)
      if (taken) {
        setError('That slot is already filled')
        return
      }
    } else if (selectedPane) {
      const free = findFirstFreeAppCell(selectedPane.apps, selectedPane.appColumns, selectedPane.appRows)
      if (!free) {
        setError('No empty cells in this pane — resize the pane or remove an app.')
        return
      }
      position = `${free.col},${free.row}`
    } else {
      setError('Select a pane')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const paneIdForCreate = props.presetSlot?.paneId ?? effectivePaneId
      await props.onSubmit({
        paneId: paneIdForCreate,
        name: trimmedName,
        url: trimmedUrl,
        icon: icon.trim(),
        position,
        openInNewTab,
      })
      props.onClose()
    } catch (e) {
      setError(String((e as Error)?.message ?? e))
    } finally {
      setBusy(false)
    }
  }

  if (props.panes.length === 0) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          aria-label="Close"
          onClick={props.onClose}
        />
        <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1018]/95 p-5 text-sm text-white/75">
          Add a pane first, then you can add apps.
          <button
            type="button"
            className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80"
            onClick={props.onClose}
          >
            OK
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        aria-label="Close"
        onClick={props.onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#0c1018]/95 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="text-sm font-medium text-white/90">Add app</div>
        <p className="mt-1 text-xs text-white/55">
          Icon slug matches{' '}
          <a
            className="text-sky-300/90 underline decoration-white/20 underline-offset-2 hover:text-sky-200"
            href="https://github.com/selfhst/icons"
            target="_blank"
            rel="noopener noreferrer"
          >
            selfhst/icons
          </a>{' '}
          (e.g. <code className="text-white/70">google-drive</code>).
        </p>
        {error ? (
          <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {error}
          </div>
        ) : null}

        {props.presetSlot ? (
          <div className="mt-4 text-xs text-white/50">
            Pane: {selectedPane?.label ?? props.presetSlot.paneId} · cell {props.presetSlot.col},
            {props.presetSlot.row}
          </div>
        ) : null}

        {props.presetSlot ? null : (
          <>
            <label className="mt-4 block text-[11px] uppercase tracking-[0.18em] text-white/45">
              Pane
            </label>
            <select
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/20"
              value={effectivePaneId}
              onChange={(e) => setPaneId(e.target.value)}
            >
              {props.panes.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0c1018]">
                  {p.label}
                </option>
              ))}
            </select>
          </>
        )}

        <label className="mt-3 block text-[11px] uppercase tracking-[0.18em] text-white/45">
          Name
        </label>
        <input
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/20"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My app"
        />

        <label className="mt-3 block text-[11px] uppercase tracking-[0.18em] text-white/45">
          URL
        </label>
        <input
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/20"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <label className="mt-3 block text-[11px] uppercase tracking-[0.18em] text-white/45">
          Icon slug
        </label>
        <input
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/20"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="e.g. homeassistant"
        />

        <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            className="rounded border-white/20 bg-white/5"
            checked={openInNewTab}
            onChange={(e) => setOpenInNewTab(e.target.checked)}
          />
          Open in new tab
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
            onClick={props.onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/90 hover:bg-white/15 disabled:opacity-50"
            onClick={() => void submit()}
            disabled={busy}
          >
            {busy ? 'Adding…' : 'Add app'}
          </button>
        </div>
      </div>
    </div>
  )
}
