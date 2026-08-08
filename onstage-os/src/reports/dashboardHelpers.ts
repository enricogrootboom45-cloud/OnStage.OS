import { PackageX, Ticket as TicketIcon, PartyPopper, AlarmClock, Radio, Bell } from 'lucide-react'
import type { NotificationType, Ticket } from '../core/types'

export interface RecentTicket extends Ticket {
  ticket_types: { name: string; price: number; events: { name: string } }
}

export interface DayBucket {
  date: string
  label: string
  sold: number
  revenue: number
}

export const TONE_DOT: Record<string, string> = {
  amber: 'bg-amber shadow-[0_0_6px_1px_rgba(232,137,58,0.5)]',
  wash: 'bg-wash',
  standby: 'bg-standby',
  graphite: 'bg-graphite',
  cuesheet: 'bg-cuesheet/60',
}

export const NOTIFICATION_ICON: Record<NotificationType, typeof Bell> = {
  low_stock: PackageX,
  ticket_sale: TicketIcon,
  milestone: PartyPopper,
  crew_late: AlarmClock,
  event_live: Radio,
}

export const DONUT_COLORS = ['#E8893A', '#5C7C93', '#C77530', '#496579', '#5A5544']

export function timeAgo(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function formatCountdown(target: Date, now: Date): string {
  const diffMs = target.getTime() - now.getTime()
  const past = diffMs < 0
  const abs = Math.abs(diffMs)
  const mins = Math.floor(abs / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  let text: string
  if (days > 0) text = `${days}d ${hrs % 24}h`
  else if (hrs > 0) text = `${hrs}h ${mins % 60}m`
  else text = `${mins} min`
  return past ? `${text} ago` : text
}

export function pctTrend(curr: number, prev: number): { direction: 'up' | 'down'; label: string } | undefined {
  if (curr === 0 && prev === 0) return undefined
  if (prev === 0) return { direction: 'up', label: 'New this week' }
  const pct = ((curr - prev) / prev) * 100
  return { direction: pct >= 0 ? 'up' : 'down', label: `${Math.abs(pct).toFixed(1)}% vs prior 7d` }
}