/** True when pointer target should not start a pane drag (app tiles, resize handles, chrome controls). */
export function shouldIgnorePaneDragTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el?.closest) return false
  return Boolean(
    el.closest('[data-app-tile]') ||
      el.closest('[data-pane-resize]') ||
      el.closest('[data-pane-no-drag]'),
  )
}
