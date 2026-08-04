import { avatarColor } from '../utils'

export function Avatar({
  name,
  size = 'md',
}: {
  name: string
  size?: 'sm' | 'md'
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?'

  const dims = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-xs'

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-blackout ${dims}`}
      style={{ background: avatarColor(name) }}
    >
      {initials}
    </div>
  )
}