/** SVGs from [selfhst/icons](https://github.com/selfhst/icons) via jsDelivr. */
const BASE = 'https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg'

export function selfhstIconSvgUrl(iconReference: string): string | null {
  const slug = iconReference
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (!slug) return null
  return `${BASE}/${encodeURIComponent(slug)}.svg`
}
