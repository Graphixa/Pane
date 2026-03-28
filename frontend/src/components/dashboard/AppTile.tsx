import type React from 'react'
import type { AppItem } from '../../features/config/types'
import type { LayoutTokens } from '../../features/layout/paneMath'

const tileClassName =
  'absolute rounded-xl border bg-white/5 backdrop-blur transition-colors hover:bg-white/10'

export default function AppTile(props: {
  app: AppItem
  tokens: LayoutTokens
  left: number
  top: number
  /** When true, tile is not a link (edit/drag mode) so pointer gestures never open the URL. */
  disableLink?: boolean
  onPointerDown?: (event: React.PointerEvent<HTMLElement>) => void
  isDragged?: boolean
  isSwapTarget?: boolean
}) {
  const { app, tokens, left, top } = props

  const isExternal = Boolean(app.openInNewTab)
  const style: React.CSSProperties = {
    left,
    top,
    width: tokens.tileSize,
    height: tokens.tileSize,
    borderColor: props.isSwapTarget ? 'rgba(250,204,21,0.9)' : 'rgba(255,255,255,0.1)',
    opacity: props.isDragged ? 0.25 : 1,
  }

  const label = (
    <div className="flex h-full w-full items-center justify-center px-1 text-[11px] text-white/80">
      <span className="line-clamp-2 text-center">{app.name}</span>
    </div>
  )

  if (props.disableLink) {
    return (
      <button
        type="button"
        className={`${tileClassName} cursor-grab touch-none select-none appearance-none active:cursor-grabbing`}
        style={style}
        aria-label={app.name}
        title={app.name}
        onPointerDown={props.onPointerDown}
      >
        {label}
      </button>
    )
  }

  return (
    <a
      href={app.url}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      draggable={false}
      className={tileClassName}
      style={style}
      aria-label={app.name}
      title={app.name}
      onPointerDown={props.onPointerDown}
    >
      {label}
    </a>
  )
}
