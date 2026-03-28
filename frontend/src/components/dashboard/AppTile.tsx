import { useEffect, useState } from 'react'
import type React from 'react'
import type { AppItem } from '../../features/config/types'
import type { LayoutTokens } from '../../features/layout/paneMath'
import { selfhstIconSvgUrl } from '../../features/icons/selfhst'

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
  const [iconFailed, setIconFailed] = useState(false)

  useEffect(() => {
    setIconFailed(false)
  }, [app.icon])

  const isExternal = Boolean(app.openInNewTab)
  const style: React.CSSProperties = {
    left,
    top,
    width: tokens.tileSize,
    height: tokens.tileSize,
    borderColor: props.isSwapTarget ? 'rgba(250,204,21,0.9)' : 'rgba(255,255,255,0.1)',
    opacity: props.isDragged ? 0.25 : 1,
  }

  const iconUrl = app.icon.trim() ? selfhstIconSvgUrl(app.icon) : null
  const showIcon = Boolean(iconUrl && !iconFailed)

  const inner = (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 pt-1">
      {showIcon ? (
        <img
          src={iconUrl!}
          alt=""
          className="pointer-events-none h-[calc(100%-2.25rem)] max-h-10 w-full flex-1 object-contain"
          draggable={false}
          onError={() => setIconFailed(true)}
        />
      ) : null}
      <div
        className={[
          'line-clamp-2 w-full text-center text-[11px] text-white/80',
          showIcon ? 'leading-tight' : '',
        ].join(' ')}
      >
        {app.name}
      </div>
    </div>
  )

  if (props.disableLink) {
    return (
      <button
        type="button"
        data-app-tile
        className={`${tileClassName} cursor-grab touch-none select-none appearance-none active:cursor-grabbing`}
        style={style}
        aria-label={app.name}
        title={app.name}
        onPointerDown={props.onPointerDown}
      >
        {inner}
      </button>
    )
  }

  return (
    <a
      data-app-tile
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
      {inner}
    </a>
  )
}
