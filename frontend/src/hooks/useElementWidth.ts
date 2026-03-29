import { useLayoutEffect, useState } from 'react'

/**
 * Tracks `element.getBoundingClientRect().width` (rounded) via ResizeObserver.
 * Returns `undefined` until the first measurement (avoid false reflow on SSR/hydration).
 */
export function useElementWidth(element: Element | null): number | undefined {
  const [w, setW] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    if (!element) {
      // Clear when the observed node unmounts (e.g. route change).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ResizeObserver target lifecycle
      setW(undefined)
      return
    }

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const next = Math.round(entry.contentRect.width)
      setW((prev) => (prev === next ? prev : next))
    })
    ro.observe(element)
    setW(Math.round(element.getBoundingClientRect().width))

    return () => ro.disconnect()
  }, [element])

  return w
}
