export function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
}

// Deterministic warm-toned color from a name, for staff avatars — stays
// within the brand's amber/wash/graphite hue family rather than random rainbow.
export function avatarColor(str: string) {
  const hash = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const hues = [28, 34, 200, 210, 60, 8] // amber, amber-warm, wash, wash-deep, graphite-warm, standby-warm
  const hue = hues[hash % hues.length]
  return `hsl(${hue}, 38%, 30%)`
}