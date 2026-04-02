import { useMemo, useState } from 'react'
import type React from 'react'
import type { DashboardConfig, PaneItem } from '../../features/config/types'
import { maxPaneRenderWidth } from '../../features/layout/reflowLayout'
import { buildReflowPresentation, needsDashboardReflow } from '../../features/layout/reflowPresentation'
import { getEffectiveTileSizeForCanvasWidth } from '../../features/layout/viewportLayout'
import {
  getAppColPitch,
  getAppColPitchDistributed,
  getAppRowPitch,
  getLayoutTokens,
  getPaneInnerContentWidth,
  getPaneMetrics,
  getPanePlacementSteps,
} from '../../features/layout/paneMath'
import type { PaneMetrics } from '../../features/layout/paneMath'
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
import {
  appsLinearIndicesFitNewGrid,
  moveOrSwapApps,
  remapAppPositionsForGridResize,
} from '../../features/apps/appMath'

function getPaneOrigin(pane: PaneItem, tokens: ReturnType<typeof getLayoutTokens>) {
  const [x, y] = parseCoordPair(pane.position)
  const { stepX, stepY } = getPanePlacementSteps(tokens)
  return { paneLeft: x * stepX, paneTop: y * stepY }
}

export default function DashboardGrid(props: {
  config: DashboardConfig
  editMode: boolean
  /** Measured inner width of the dashboard canvas (undefined until first layout). */
  containerContentWidth?: number
  onCommitConfig: (next: DashboardConfig) => Promise<void>
  onCommitConfigFromServer: (next: DashboardConfig) => Promise<void>
  onRequestAddAppAt?: (paneId: string, col: number, row: number) => void
}) {
  const [interaction, setInteraction] = useState<ActiveInteraction>({ type: 'none' })
  const [saveError, setSaveError] = useState<string | null>(null)

  const effectiveTileSize = useMemo(
    () =>
      getEffectiveTileSizeForCanvasWidth(
        props.containerContentWidth,
        props.config.appLayout.size,
      ),
    [props.containerContentWidth, props.config.appLayout.size],
  )

  const tokens = useMemo(() => getLayoutTokens(effectiveTileSize), [effectiveTileSize])
  const { stepX, stepY } = getPanePlacementSteps(tokens)
  const resizeColStep = getAppColPitch(tokens)
  const appRowPitch = getAppRowPitch(tokens)

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
      (acc, p) => Math.max(acc, p.paneTop + p.metrics.renderPaneHeight),
      0,
    )
    const nextWidth = panesWithMetrics.reduce(
      (acc, p) => Math.max(acc, p.paneLeft + p.metrics.renderPaneWidth),
      0,
    )

    return { panes: panesWithMetrics, height: nextHeight, width: nextWidth }
  }, [interaction, props.config.panes, tokens])

  const needsReflow = useMemo(() => {
    const cw = props.containerContentWidth
    if (cw === undefined || cw <= 0) return false
    return needsDashboardReflow(props.config, cw, effectiveTileSize)
  }, [props.config, props.containerContentWidth, effectiveTileSize])

  /** Flex wrap presentation is view-only; edit uses the saved grid + horizontal scroll until pack fits. */
  const viewReflowPresentation = useMemo(() => {
    const cw = props.containerContentWidth
    if (props.editMode || !needsReflow) return null
    if (cw === undefined || cw <= 0) return null
    return buildReflowPresentation(props.config, cw, effectiveTileSize)
  }, [needsReflow, props.editMode, props.config, props.containerContentWidth, effectiveTileSize])

  const reflowScale = useMemo(() => {
    const cw = props.containerContentWidth
    if (!viewReflowPresentation || cw === undefined || cw <= 0) return 1
    const flat = viewReflowPresentation.rows.flat()
    const maxPane = maxPaneRenderWidth(flat.map((e) => ({ pane: e.pane, metrics: e.metrics })))
    if (maxPane <= cw) return 1
    return cw / maxPane
  }, [viewReflowPresentation, props.containerContentWidth])

  const editOverflowScroll = props.editMode && needsReflow

  function onPaneDragStart(pane: PaneItem, event: React.PointerEvent<HTMLDivElement>) {
    if (!props.editMode) return
    const [startGridX, startGridY] = parseCoordPair(pane.position)
    const metrics = getPaneMetrics(pane.appColumns, pane.appRows, tokens)
    setSaveError(null)

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
    const tileRect = event.currentTarget.getBoundingClientRect()
    setInteraction({
      type: 'app-drag',
      paneId: pane.id,
      appId: app.id,
      session: createPointerSession(event.pointerId, { x: event.clientX, y: event.clientY }),
      contentRectLeft: contentRect.left,
      contentRectTop: contentRect.top,
      pickupOffsetX: event.clientX - tileRect.left,
      pickupOffsetY: event.clientY - tileRect.top,
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

    const pane = props.config.panes.find((p) => p.id === interactionState.paneId)
    if (!pane) return

    const newCols = interactionState.previewColumns
    const newRows = interactionState.previewRows
    const dimsChanged = newCols !== pane.appColumns || newRows !== pane.appRows
    const nextApps = dimsChanged
      ? remapAppPositionsForGridResize(pane.apps, pane.appColumns, newCols, newRows)
      : pane.apps

    const next = {
      ...props.config,
      panes: props.config.panes.map((p) =>
        p.id === interactionState.paneId
          ? {
              ...p,
              appColumns: newCols,
              appRows: newRows,
              apps: nextApps,
            }
          : p,
      ),
    }
    await props.onCommitConfig(next)

    let merged = await apiUpdatePane(interactionState.paneId, {
      appColumns: newCols,
      appRows: newRows,
    })

    const moved = nextApps.filter((a) => {
      const prev = pane.apps.find((x) => x.id === a.id)
      return prev && prev.position !== a.position
    })
    for (const app of moved) {
      merged = await apiUpdateApp(interactionState.paneId, app.id, { position: app.position })
    }

    await props.onCommitConfigFromServer(merged)
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

  async function renamePane(paneId: string, label: string) {
    setSaveError(null)
    const next = {
      ...props.config,
      panes: props.config.panes.map((p) => (p.id === paneId ? { ...p, label } : p)),
    }
    try {
      await props.onCommitConfig(next)
      const fromServer = await apiUpdatePane(paneId, { label })
      await props.onCommitConfigFromServer(fromServer)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      setSaveError(msg)
    }
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
        stepX,
        stepY,
      )
      const validDrop = isValidPanePlacement({
        panes: props.config.panes,
        appSize: effectiveTileSize,
        paneId: interaction.paneId,
        x: preview.previewGridX,
        y: preview.previewGridY,
        maxContentWidthPx: props.containerContentWidth,
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

      const dragPane = props.config.panes.find((p) => p.id === interaction.paneId)
      const dragMetrics = dragPane
        ? getPaneMetrics(dragPane.appColumns, dragPane.appRows, tokens)
        : null
      const dragInnerW = dragMetrics
        ? getPaneInnerContentWidth(dragMetrics.renderPaneWidth, tokens)
        : 0
      const appColStepDistributed = dragPane
        ? getAppColPitchDistributed(tokens, dragPane.appColumns, dragInnerW)
        : resizeColStep

      const preview = getAppDragPreview({
        pointerX: session.current.x,
        pointerY: session.current.y,
        contentRectLeft: interaction.contentRectLeft,
        contentRectTop: interaction.contentRectTop,
        appColStep: appColStepDistributed,
        appRowStep: appRowPitch,
        gridInsetX: tokens.gridInsetX,
        gridInsetY: tokens.gridInsetY,
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
      resizeColStep,
      appRowPitch,
    )
    const resizingPane = props.config.panes.find((p) => p.id === interaction.paneId)
    const appsFit =
      resizingPane &&
      appsLinearIndicesFitNewGrid(
        resizingPane.apps,
        resizingPane.appColumns,
        preview.previewColumns,
        preview.previewRows,
      )
    const validDrop =
      isValidPanePlacement({
        panes: props.config.panes,
        appSize: effectiveTileSize,
        paneId: interaction.paneId,
        appColumns: preview.previewColumns,
        appRows: preview.previewRows,
        maxContentWidthPx: props.containerContentWidth,
      }) && Boolean(appsFit)

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

  function renderPaneCard(args: {
    pane: PaneItem
    paneLeft: number
    paneTop: number
    metrics: PaneMetrics
    flowLayout?: boolean
  }) {
    const { pane, paneLeft, paneTop, metrics, flowLayout } = args
    const isResizePreview =
      interaction.type === 'pane-resize' && interaction.paneId === pane.id
    const gridColumns = isResizePreview ? interaction.previewColumns : pane.appColumns
    const gridRows = isResizePreview ? interaction.previewRows : pane.appRows
    return (
      <PaneCard
        key={pane.id}
        pane={pane}
        gridColumns={gridColumns}
        gridRows={gridRows}
        tokens={tokens}
        paneLeft={paneLeft}
        paneTop={paneTop}
        metrics={metrics}
        flowLayout={flowLayout}
        editMode={props.editMode}
        onPaneDragStart={onPaneDragStart}
        onResizeStart={onResizeStart}
        onAppDragStart={onAppDragStart}
        onDeletePane={deletePane}
        onDeleteApp={deleteApp}
        onRenamePane={renamePane}
        onRequestAddAppAt={props.onRequestAddAppAt}
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
                clientX: interaction.session.current.x,
                clientY: interaction.session.current.y,
                pickupOffsetX: interaction.pickupOffsetX,
                pickupOffsetY: interaction.pickupOffsetY,
              }
            : undefined
        }
      />
    )
  }

  // View: flex reflow when overflowing. Edit: saved grid + optional horizontal scroll until pack fits.
  return (
    <div
      className={`relative h-full min-h-0 w-full overflow-y-auto ${editOverflowScroll ? 'overflow-x-auto' : 'overflow-x-hidden'}`}
      style={{
        scrollbarGutter: 'stable',
        minHeight: viewReflowPresentation ? undefined : height + stepY,
        minWidth: viewReflowPresentation ? undefined : width + stepX,
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      {props.editMode && !viewReflowPresentation ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.055) 0 1px, transparent 1px ${stepY}px),
repeating-linear-gradient(90deg, rgba(255,255,255,0.055) 0 1px, transparent 1px ${stepX}px)`,
          }}
        />
      ) : null}
      {saveError ? (
        <div className="sticky left-4 top-4 z-50 mb-2 inline-block rounded bg-red-500/20 px-3 py-1 text-xs text-red-100">
          Failed to persist pane update: {saveError}
        </div>
      ) : null}
      {viewReflowPresentation ? (
        <div
          className="w-full overflow-x-hidden"
          style={{
            height: viewReflowPresentation.contentHeight * reflowScale,
            minHeight: viewReflowPresentation.contentHeight * reflowScale,
          }}
        >
          <div className="flex w-full justify-center overflow-x-hidden">
            <div
              className="relative shrink-0"
              style={{
                width: viewReflowPresentation.contentWidth,
                height: viewReflowPresentation.contentHeight,
                transform: reflowScale < 1 ? `scale(${reflowScale})` : undefined,
                transformOrigin: 'top center',
              }}
            >
              <div
                className="flex w-full flex-col items-stretch"
                style={{ gap: tokens.paneGap }}
              >
                {viewReflowPresentation.rows.map((rowEntries, ri) => (
                  <div
                    key={ri}
                    className="flex w-full flex-row flex-nowrap justify-center"
                    style={{ gap: tokens.paneGap }}
                  >
                    {rowEntries.map((entry) =>
                      renderPaneCard({
                        pane: entry.pane,
                        metrics: entry.metrics,
                        paneLeft: 0,
                        paneTop: 0,
                        flowLayout: true,
                      }),
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        panes.map(({ pane, paneLeft, paneTop, metrics }) =>
          renderPaneCard({ pane, paneLeft, paneTop, metrics }),
        )
      )}
    </div>
  )
}

