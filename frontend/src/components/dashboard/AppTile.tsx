import { useEffect, useState } from 'react'
import type React from 'react'
import type { AppItem } from '../../features/config/types'
import type { LayoutTokens } from '../../features/layout/paneMath'
import { selfhstIconSvgUrl } from '../../features/icons/selfhst'

const iconShellClass =
  'flex shrink-0 items-center justify-center rounded-xl border bg-white/5 backdrop-blur transition-colors hover:bg-white/10'

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
  const borderColor = props.isSwapTarget ? 'rgba(250,204,21,0.9)' : 'rgba(255,255,255,0.1)'
  const dim = props.isDragged ? 0.08 : 1

  const iconUrl = app.icon.trim() ? selfhstIconSvgUrl(app.icon) : null
  const showIcon = Boolean(iconUrl && !iconFailed)

  const iconInner = showIcon ? (
    <img
      src={iconUrl!}
      alt=""
      className="pointer-events-none object-contain"
      style={{
        width: Math.max(0, tokens.tileSize - 8),
        height: Math.max(0, tokens.tileSize - 8),
      }}
      draggable={false}
      onError={() => setIconFailed(true)}
    />
  ) : props.disableLink ? (
    <span
      className="pointer-events-none select-none text-[13px] font-light leading-none text-white/35"
      aria-hidden
    >
      +
    </span>
  ) : null

  /** Fixed band height — must match `appCellHeight` math in paneMath (minHeight allowed 2-line text to exceed it). */
  const label = (
    <div
      className={[
        'mt-0 w-full overflow-hidden text-center text-[10px] leading-snug text-white/75 line-clamp-2',
        props.disableLink ? 'pointer-events-none select-none' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        marginTop: tokens.iconLabelGap,
        height: tokens.labelBandHeight,
      }}
    >
      {app.name}
    </div>
  )

  if (props.disableLink) {
    return (
      <div
        className="absolute z-[1]"
        style={{
          left,
          top,
          width: tokens.tileSize,
          opacity: dim,
        }}
      >
        <button
          type="button"
          data-app-tile
          className={`${iconShellClass} cursor-grab touch-none select-none appearance-none active:cursor-grabbing`}
          style={{
            width: tokens.tileSize,
            height: tokens.tileSize,
            borderColor,
          }}
          aria-label={app.name}
          title={app.name}
          onPointerDown={props.onPointerDown}
        >
          {iconInner}
        </button>
        {label}
      </div>
    )
  }

  return (
    <a
      className="absolute z-[1] block text-left no-underline"
      href={app.url}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      draggable={false}
      style={{
        left,
        top,
        width: tokens.tileSize,
        opacity: dim,
      }}
      aria-label={app.name}
      title={app.name}
      onPointerDown={props.onPointerDown}
    >
      <div
        className={iconShellClass}
        style={{
          width: tokens.tileSize,
          height: tokens.tileSize,
          borderColor,
        }}
      >
        {iconInner}
      </div>
      {label}
    </a>
  )
}
