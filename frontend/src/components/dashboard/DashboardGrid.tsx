import { useMemo, useState } from 'react'
import type React from 'react'
import type { DashboardConfig, PaneItem } from '../../features/config/types'
import { getLayoutTokens, getPaneMetrics } from '../../features/layout/paneMath'
import type { ActiveInteraction } from '../../features/interaction/dragTypes'
import { createPointerSession, updatePointerSession } from '../../features/interaction/pointerSession'
import { getPaneDragPreview } from '../../features/interaction/paneDrag'
import { getPaneResizePreview } from '../../features/interaction/paneResize'
import { getAppDragPreview } from '../../features/interaction/appDrag'
import { isValidPanePlacement } from '../../features/interaction/collision'
import { formatCoordPair, parseCoordPair } from '../../lib/coords'
import PaneCard from './PaneCard'
import { updatePane as apiUpdatePane, deletePane as apiDeletePane } from '../../features/panes/api'
import { updateApp as apiUpdateApp, deleteApp as apiDeleteApp } from '../../features/apps/api'
import { moveOrSwapApps } from '../../features/apps/appMath'

function getPaneOrigin(pane: PaneItem, tokens: ReturnType<typeof getLayoutTokens>) {
  const [x, y] = parseCoordPair(pane.position)
  const step = tokens.paneCellSize + tokens.paneGap
  return { paneLeft: x * step, paneTop: y * step }
}

export default function DashboardGrid(props: {
  config: DashboardConfig
  editMode: boolean
  onCommitConfig: (next: DashboardConfig) => Promise<void>
  onCommitConfigFromServer: (next: DashboardConfig) => Promise<void>
}) {
  const [interaction, setInteraction] = useState<ActiveInteraction>({ type: 'none' })
  const [saveError, setSaveError] = useState<string | null>(null)

  const tokens = useMemo(
    () => getLayoutTokens(props.config.appLayout.size),
    [props.config.appLayout.size],
  )
  const step = tokens.paneCellSize + tokens.paneGap

  const { panes, height, width } = useMemo(() => {
    const panesWithMetrics = props.config.panes.map((pane) => {
      const isDragPreview =
        interaction.type === 'pane-drag' && interaction.paneId === pane.id
      const isResizePreview =
        interaction.type === 'pane-resize' && interaction.paneId === pane.id

      const panePosition = isDragPreview
        ? formatCoordPair(interaction.previewGridX, interaction.previewGridY)
        : pane.position
      const appColumns = isResizePreview ? interaction.previewColumns : pane.appColumns
      const appRows = isResizePreview ? interaction.previewRows : pane.appRows

      const paneForLayout: PaneItem = {
        ...pane,
        position: panePosition,
        appColumns,
        appRows,
      }

      const { paneLeft, paneTop } = getPaneOrigin(paneForLayout, tokens)
      const metrics = getPaneMetrics(appColumns, appRows, tokens)
      return { pane, paneLeft, paneTop, metrics }
    })

    const nextHeight = panesWithMetrics.reduce(
      (acc, p) => Math.max(acc, p.paneTop + p.metrics.paneHeight),
      0,
    )
    const nextWidth = panesWithMetrics.reduce(
      (acc, p) => Math.max(acc, p.paneLeft + p.metrics.paneWidth),
      0,
    )

    return { panes: panesWithMetrics, height: nextHeight, width: nextWidth }
  }, [interaction, props.config.panes, tokens])

  const paneGridStep = tokens.paneCellSize + tokens.paneGap
  const tileStep = tokens.tileSize + tokens.tileGap

  function onPaneDragStart(pane: PaneItem, event: React.PointerEvent<HTMLDivElement>) {
    if (!props.editMode) return
    const [startGridX, startGridY] = parseCoordPair(pane.position)
    const metrics = getPaneMetrics(pane.appColumns, pane.appRows, tokens)
    setSaveError(null)

    event.currentTarget.setPointerCapture(event.pointerId)
    setInteraction({
      type: 'pane-drag',
      paneId: pane.id,
      session: createPointerSession(event.pointerId, { x: event.clientX, y: event.clientY }),
      startGridX,
      startGridY,
      previewGridX: startGridX,
      previewGridY: startGridY,
      spanX: metrics.gridSpanX,
      spanY: metrics.gridSpanY,
      validDrop: true,
    })
  }

  function onResizeStart(
    pane: PaneItem,
    edge: 'right' | 'bottom' | 'bottom-right',
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    if (!props.editMode) return
    setSaveError(null)
    event.currentTarget.setPointerCapture(event.pointerId)
    setInteraction({
      type: 'pane-resize',
      paneId: pane.id,
      edge,
      session: createPointerSession(event.pointerId, { x: event.clientX, y: event.clientY }),
      startColumns: pane.appColumns,
      startRows: pane.appRows,
      previewColumns: pane.appColumns,
      previewRows: pane.appRows,
      validDrop: true,
    })
  }

  function onAppDragStart(
    pane: PaneItem,
    app: { id: string; position: string },
    contentRect: DOMRect,
    event: React.PointerEvent<HTMLElement>,
  ) {
    if (!props.editMode) return
    const [startCol, startRow] = parseCoordPair(app.position)
    setSaveError(null)

    event.currentTarget.setPointerCapture(event.pointerId)
    setInteraction({
      type: 'app-drag',
      paneId: pane.id,
      appId: app.id,
      session: createPointerSession(event.pointerId, { x: event.clientX, y: event.clientY }),
      contentRectLeft: contentRect.left,
      contentRectTop: contentRect.top,
      appColumns: pane.appColumns,
      appRows: pane.appRows,
      startCol,
      startRow,
      previewCol: startCol,
      previewRow: startRow,
    })
  }

  async function commitDrag(interactionState: Extract<ActiveInteraction, { type: 'pane-drag' }>) {
    if (!interactionState.validDrop) return

    const next = {
      ...props.config,
      panes: props.config.panes.map((pane) =>
        pane.id === interactionState.paneId
          ? {
              ...pane,
              position: formatCoordPair(interactionState.previewGridX, interactionState.previewGridY),
            }
          : pane,
      ),
    }
    await props.onCommitConfig(next)
    const fromServer = await apiUpdatePane(interactionState.paneId, {
      position: formatCoordPair(interactionState.previewGridX, interactionState.previewGridY),
    })
    await props.onCommitConfigFromServer(fromServer)
  }

  async function commitResize(
    interactionState: Extract<ActiveInteraction, { type: 'pane-resize' }>,
  ) {
    if (!interactionState.validDrop) return

    const next = {
      ...props.config,
      panes: props.config.panes.map((pane) =>
        pane.id === interactionState.paneId
          ? {
              ...pane,
              appColumns: interactionState.previewColumns,
              appRows: interactionState.previewRows,
            }
          : pane,
      ),
    }
    await props.onCommitConfig(next)
    const fromServer = await apiUpdatePane(interactionState.paneId, {
      appColumns: interactionState.previewColumns,
      appRows: interactionState.previewRows,
    })
    await props.onCommitConfigFromServer(fromServer)
  }

  async function commitAppDrag(
    interactionState: Extract<ActiveInteraction, { type: 'app-drag' }>,
  ) {
    const pane = props.config.panes.find((p) => p.id === interactionState.paneId)
    if (!pane) return

    const sourcePos =
      pane.apps.find((a) => a.id === interactionState.appId)?.position ?? null
    const targetPos = formatCoordPair(interactionState.previewCol, interactionState.previewRow)
    const result = moveOrSwapApps({
      apps: pane.apps,
      draggedAppId: interactionState.appId,
      targetPosition: targetPos,
    })
    if (result.type === 'noop') return

    const nextPanes = props.config.panes.map((p) => {
      if (p.id !== pane.id) return p

      return {
        ...p,
        apps: result.apps,
      }
    })

    const optimistic = { ...props.config, panes: nextPanes }
    await props.onCommitConfig(optimistic)

    // Persist only on end, and persist both positions on swap.
    if (result.type === 'move') {
      const fromServer = await apiUpdateApp(pane.id, interactionState.appId, { position: targetPos })
      await props.onCommitConfigFromServer(fromServer)
      return
    }

    if (!sourcePos) return

    const [a, b] = await Promise.all([
      apiUpdateApp(pane.id, interactionState.appId, { position: targetPos }),
      apiUpdateApp(pane.id, result.collidedAppId, { position: sourcePos }),
    ])
    await props.onCommitConfigFromServer(b ?? a)
  }

  async function deletePane(paneId: string) {
    const next = { ...props.config, panes: props.config.panes.filter((p) => p.id !== paneId) }
    await props.onCommitConfig(next)
    const fromServer = await apiDeletePane(paneId)
    await props.onCommitConfigFromServer(fromServer)
  }

  async function deleteApp(paneId: string, appId: string) {
    const next = {
      ...props.config,
      panes: props.config.panes.map((p) =>
        p.id === paneId ? { ...p, apps: p.apps.filter((a) => a.id !== appId) } : p,
      ),
    }
    await props.onCommitConfig(next)
    const fromServer = await apiDeleteApp(paneId, appId)
    await props.onCommitConfigFromServer(fromServer)
  }

  async function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (interaction.type === 'none') return
    if (event.pointerId !== interaction.session.pointerId) return

    if (interaction.type === 'pane-drag') {
      const session = updatePointerSession(interaction.session, {
        x: event.clientX,
        y: event.clientY,
      })
      const preview = getPaneDragPreview(
        interaction.startGridX,
        interaction.startGridY,
        session.delta.x,
        session.delta.y,
        paneGridStep,
      )
      const validDrop = isValidPanePlacement({
        panes: props.config.panes,
        appSize: props.config.appLayout.size,
        paneId: interaction.paneId,
        x: preview.previewGridX,
        y: preview.previewGridY,
      })

      setInteraction({
        ...interaction,
        session,
        previewGridX: preview.previewGridX,
        previewGridY: preview.previewGridY,
        validDrop,
      })
      return
    }

    if (interaction.type === 'app-drag') {
      const session = updatePointerSession(interaction.session, {
        x: event.clientX,
        y: event.clientY,
      })

      const preview = getAppDragPreview({
        pointerX: session.current.x,
        pointerY: session.current.y,
        contentRectLeft: interaction.contentRectLeft,
        contentRectTop: interaction.contentRectTop,
        tileStep,
        appColumns: interaction.appColumns,
        appRows: interaction.appRows,
      })

      const pane = props.config.panes.find((p) => p.id === interaction.paneId)
      const targetPos = formatCoordPair(preview.previewCol, preview.previewRow)
      const collided = pane?.apps.find(
        (a) => a.id !== interaction.appId && a.position === targetPos,
      )

      setInteraction({
        ...interaction,
        session,
        previewCol: preview.previewCol,
        previewRow: preview.previewRow,
        collidedAppId: collided?.id,
      })
      return
    }

    const session = updatePointerSession(interaction.session, {
      x: event.clientX,
      y: event.clientY,
    })
    const preview = getPaneResizePreview(
      interaction.edge,
      interaction.startColumns,
      interaction.startRows,
      session.delta.x,
      session.delta.y,
      tileStep,
    )
    const validDrop = isValidPanePlacement({
      panes: props.config.panes,
      appSize: props.config.appLayout.size,
      paneId: interaction.paneId,
      appColumns: preview.previewColumns,
      appRows: preview.previewRows,
    })

    setInteraction({
      ...interaction,
      session,
      previewColumns: preview.previewColumns,
      previewRows: preview.previewRows,
      validDrop,
    })
  }

  async function onPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (interaction.type === 'none') return
    if (event.pointerId !== interaction.session.pointerId) return

    const prev = interaction
    setInteraction({ type: 'none' })
    try {
      if (prev.type === 'pane-drag') {
        await commitDrag(prev)
      } else if (prev.type === 'pane-resize') {
        await commitResize(prev)
      } else {
        await commitAppDrag(prev)
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      setSaveError(msg)
    }
  }

  // Capacity-based deterministic positioning: panes are placed on logical steps.
  return (
    <div
      className="relative h-full w-full overflow-auto"
      style={{
        minHeight: height + step,
        minWidth: width + step,
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      {props.editMode ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px ${paneGridStep}px),
repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px ${paneGridStep}px)`,
          }}
        />
      ) : null}
      {saveError ? (
        <div className="sticky left-4 top-4 z-50 mb-2 inline-block rounded bg-red-500/20 px-3 py-1 text-xs text-red-100">
          Failed to persist pane update: {saveError}
        </div>
      ) : null}
      {panes.map(({ pane, paneLeft, paneTop, metrics }) => (
        <PaneCard
          key={pane.id}
          pane={pane}
          tokens={tokens}
          paneLeft={paneLeft}
          paneTop={paneTop}
          metrics={metrics}
          editMode={props.editMode}
          onPaneDragStart={onPaneDragStart}
          onResizeStart={onResizeStart}
          onAppDragStart={onAppDragStart}
          onDeletePane={deletePane}
          onDeleteApp={deleteApp}
          dragState={
            interaction.type === 'pane-drag' && interaction.paneId === pane.id
              ? { active: true, validDrop: interaction.validDrop }
              : undefined
          }
          resizeState={
            interaction.type === 'pane-resize' && interaction.paneId === pane.id
              ? { active: true, validDrop: interaction.validDrop }
              : undefined
          }
          appDragState={
            interaction.type === 'app-drag' && interaction.paneId === pane.id
              ? {
                  appId: interaction.appId,
                  previewCol: interaction.previewCol,
                  previewRow: interaction.previewRow,
                  collidedAppId: interaction.collidedAppId,
                }
              : undefined
          }
        />
      ))}
    </div>
  )
}

