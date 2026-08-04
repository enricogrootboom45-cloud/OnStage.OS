import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3, Wallet, Ticket as TicketIcon, UserCheck, PackageX,
  Users, ArrowUpRight, Bell, PartyPopper, AlarmClock, Radio,
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { TopBar } from '../core/layout/TopBar'
import { StatCard } from '../core/components/StatCard'
import { EmptyState } from '../core/components/EmptyState'
import { Avatar } from '../core/components/Avatar'
import { CueLight } from '../core/components/CueLight'
import { ticketStatusMeta, shiftStatusMeta } from '../core/statusMeta'
import { formatMoney } from '../core/utils'
import type { AppNotification, NotificationType, Shift, Staff, Ticket } from '../core/types'

// ── Types for the joined shapes this dashboard actually queries ──────
interface RecentTicket extends Ticket {
  ticket_types: { name: string; price: number; events: { name: string } }
}
interface ShiftWithStaff extends Shift {
  staff: Staff
}
interface DayBucket {
  date: string
  label: string
  sold: number
  revenue: number
}

const TONE_DOT: Record<string, string> = {
  amber: 'bg-amber shadow-[0_0_6px_1px_rgba(232,137,58,0.5)]',
  wash: 'bg-wash',
  standby: 'bg-standby',
  graphite: 'bg-graphite',
  cuesheet: 'bg-cuesheet/60',
}

const NOTIFICATION_ICON: Record<NotificationType, typeof Bell> = {
  low_stock: PackageX,
  ticket_sale: TicketIcon,
  milestone: PartyPopper,
  crew_late: AlarmClock,
  event_live: Radio,
}

const DONUT_COLORS = ['#E8893A', '#5C7C93', '#C77530', '#496579', '#5A5544']

function timeAgo(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function pctTrend(curr: number, prev: number): { direction: 'up' | 'down'; label: string } | undefined {
  if (curr === 0 && prev === 0) return undefined
  if (prev === 0) return { direction: 'up', label: 'New this week' }
  const pct = ((curr - prev) / prev) * 100
  return {
    direction: pct >= 0 ? 'up' : 'down',
    label: `${Math.abs(pct).toFixed(1)}% vs prior 7d`,
  }
}

export function ReportsHome() {
  const { organization } = useAuth()
  const [loading, setLoading] = useState(true)

  const [eventCount, setEventCount] = useState(0)
  const [liveEventCount, setLiveEventCount] = useState(0)
  const [liveEventName, setLiveEventName] = useState<string | null>(null)
  const [staffClockedIn, setStaffClockedIn] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)

  const [dailyBuckets, setDailyBuckets] = useState<DayBucket[]>([])
  const [chartWindow, setChartWindow] = useState<7 | 30>(30)
  const [tierRevenue, setTierRevenue] = useState<{ name: string; value: number }[]>([])
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([])

  const [teamOnDuty, setTeamOnDuty] = useState<ShiftWithStaff[]>([])
  const [activity, setActivity] = useState<AppNotification[]>([])

  useEffect(() => {
    if (!organization) return
    const org = organization
    let cancelled = false

    async function load() {
      setLoading(true)

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
      thirtyDaysAgo.setHours(0, 0, 0, 0)

      const [eventsRes, shiftsRes, equipmentRes, ticketsRes, activityRes] = await Promise.all([
        supabase.from('events').select('id, name, status').eq('organization_id', org.id),
        supabase
          .from('shifts')
          .select('id, status, events!inner(organization_id)')
          .eq('status', 'clocked_in')
          .eq('events.organization_id', org.id),
        supabase
          .from('equipment')
          .select('id, quantity_available, low_stock_threshold')
          .eq('organization_id', org.id),
        supabase
          .from('tickets')
          .select('*, ticket_types!inner(name, price, events!inner(name, organization_id))')
          .eq('ticket_types.events.organization_id', org.id)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('notifications')
          .select('*')
          .eq('organization_id', org.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      if (cancelled) return

      const events = eventsRes.data || []
      setEventCount(events.length)
      const liveEvent = events.find((e) => e.status === 'live') || null
      setLiveEventCount(events.filter((e) => e.status === 'live').length)
      setLiveEventName(liveEvent?.name || null)
      setStaffClockedIn(shiftsRes.data?.length || 0)

      const equipment = equipmentRes.data || []
      setLowStockCount(equipment.filter((e) => e.quantity_available <= e.low_stock_threshold).length)

      // ── Build 30 daily buckets from the ticket set we already fetched ──
      const tickets = (ticketsRes.data as RecentTicket[]) || []
      const sellable = tickets.filter((t) => t.status === 'valid' || t.status === 'checked_in')

      const buckets: DayBucket[] = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        buckets.push({
          date: key,
          label: d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }),
          sold: 0,
          revenue: 0,
        })
      }
      const bucketByDate = new Map(buckets.map((b) => [b.date, b]))
      for (const t of sellable) {
        const key = t.created_at.slice(0, 10)
        const bucket = bucketByDate.get(key)
        if (bucket) {
          bucket.sold += 1
          bucket.revenue += Number(t.amount_paid) || Number(t.ticket_types?.price) || 0
        }
      }
      setDailyBuckets(buckets)

      // ── Revenue / tickets-sold by tier, last 30 days ──
      const tierMap = new Map<string, number>()
      for (const t of sellable) {
        const name = t.ticket_types?.name || 'Other'
        tierMap.set(name, (tierMap.get(name) || 0) + (Number(t.amount_paid) || Number(t.ticket_types?.price) || 0))
      }
      const sortedTiers = Array.from(tierMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
      setTierRevenue(sortedTiers.slice(0, 5))

      setRecentTickets(tickets.slice(0, 5))
      setActivity((activityRes.data as AppNotification[]) || [])

      // ── Team on duty — for the live event, if there is one ──
      if (liveEvent) {
        const { data: shiftData } = await supabase
          .from('shifts')
          .select('*, staff(*)')
          .eq('event_id', liveEvent.id)
        setTeamOnDuty((shiftData as ShiftWithStaff[]) || [])
      } else {
        setTeamOnDuty([])
      }

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [organization])

  // ── Derived 7d vs prior-7d trends from the buckets we already built ──
  const { revenue7d, sold7d, revenueTrend, soldTrend } = useMemo(() => {
    if (dailyBuckets.length < 14) return { revenue7d: 0, sold7d: 0, revenueTrend: undefined, soldTrend: undefined }
    const last7 = dailyBuckets.slice(-7)
    const prior7 = dailyBuckets.slice(-14, -7)
    const rev7 = last7.reduce((s, b) => s + b.revenue, 0)
    const revP = prior7.reduce((s, b) => s + b.revenue, 0)
    const sold7 = last7.reduce((s, b) => s + b.sold, 0)
    const soldP = prior7.reduce((s, b) => s + b.sold, 0)
    return {
      revenue7d: rev7,
      sold7d: sold7,
      revenueTrend: pctTrend(rev7, revP),
      soldTrend: pctTrend(sold7, soldP),
    }
  }, [dailyBuckets])

  const chartData = useMemo(() => dailyBuckets.slice(-chartWindow), [dailyBuckets, chartWindow])
  const tierTotal = tierRevenue.reduce((s, t) => s + t.value, 0)

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard
            label="Revenue (7d)"
            value={loading ? '—' : formatMoney(revenue7d)}
            trend={revenueTrend}
            icon={<Wallet size={16} />}
          />
          <StatCard
            label="Tickets sold (7d)"
            value={loading ? '—' : String(sold7d)}
            trend={soldTrend}
            icon={<TicketIcon size={16} />}
          />
          <StatCard
            label="Live now"
            value={loading ? '—' : String(liveEventCount)}
            hint={liveEventCount > 0 ? (liveEventName || 'In progress') : 'Nothing on stage'}
            icon={<BarChart3 size={16} />}
            tone={liveEventCount > 0 ? 'live' : 'default'}
          />
          <StatCard
            label="Crew clocked in"
            value={loading ? '—' : String(staffClockedIn)}
            icon={<UserCheck size={16} />}
          />
          <StatCard
            label="Low stock alerts"
            value={loading ? '—' : String(lowStockCount)}
            tone={lowStockCount > 0 ? 'warning' : 'default'}
            icon={<PackageX size={16} />}
          />
        </div>

        {/* Sales chart + tier donut */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-graphite-line bg-riser p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-sm font-medium text-cuesheet">Ticket sales</p>
                <p className="mt-0.5 text-xs text-cuesheet/40">
                  New tickets sold per day, {eventCount} event{eventCount === 1 ? '' : 's'} total
                </p>
              </div>
              <select
                value={chartWindow}
                onChange={(e) => setChartWindow(Number(e.target.value) as 7 | 30)}
                className="rounded-md border border-graphite-line bg-blackout px-2.5 py-1.5 text-xs text-cuesheet"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
              </select>
            </div>

            {!loading && dailyBuckets.every((b) => b.sold === 0) ? (
              <div className="mt-2">
                <EmptyState
                  title="No ticket sales yet"
                  body="Once events go on sale, this chart fills in automatically — no setup needed."
                />
              </div>
            ) : (
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E8893A" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#E8893A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#332F25" vertical={false} />
                    <XAxis dataKey="label" stroke="#5A5544" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#5A5544" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                    <Tooltip
                      contentStyle={{ background: '#1E1B14', border: '1px solid #332F25', borderRadius: 6, fontSize: 12 }}
                      labelStyle={{ color: '#F6F2E7' }}
                      formatter={(v: number) => [`${v} sold`, '']}
                    />
                    <Area type="monotone" dataKey="sold" stroke="#E8893A" strokeWidth={2} fill="url(#salesFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-graphite-line bg-riser p-5">
            <p className="font-display text-sm font-medium text-cuesheet">Revenue by tier</p>
            <p className="mt-0.5 text-xs text-cuesheet/40">Last 30 days</p>

            {!loading && tierRevenue.length === 0 ? (
              <div className="mt-8 text-center text-sm text-cuesheet/30">No sales yet</div>
            ) : (
              <>
                <div className="mt-2 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={tierRevenue} dataKey="value" nameKey="name" innerRadius={45} outerRadius={68} paddingAngle={2}>
                        {tierRevenue.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1E1B14', border: '1px solid #332F25', borderRadius: 6, fontSize: 12 }}
                        formatter={(v: number) => formatMoney(v)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-1.5">
                  {tierRevenue.map((t, i) => (
                    <div key={t.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-cuesheet/60">
                        <span className="h-2 w-2 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        {t.name}
                      </span>
                      <span className="font-mono text-cuesheet/40">
                        {tierTotal > 0 ? Math.round((t.value / tierTotal) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Team on duty / Recent sales / Workspace activity */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Team on duty */}
          <div className="rounded-lg border border-graphite-line bg-riser p-5">
            <p className="font-display text-sm font-medium text-cuesheet">Team on duty</p>
            <p className="mt-0.5 text-xs text-cuesheet/40">
              {liveEventName ? `Working ${liveEventName}` : 'Who is on shift right now'}
            </p>
            <div className="mt-4 space-y-3">
              {!loading && teamOnDuty.length === 0 ? (
                <p className="py-4 text-center text-xs text-cuesheet/30">
                  {liveEventName ? 'No crew assigned to this event yet' : 'No live event right now'}
                </p>
              ) : (
                teamOnDuty.map((shift) => {
                  const meta = shiftStatusMeta(shift.status)
                  return (
                    <div key={shift.id} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar name={shift.staff?.full_name || '?'} size="sm" />
                        <span
                          className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-riser ${TONE_DOT[meta.tone]}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-cuesheet">{shift.staff?.full_name}</p>
                        <p className="truncate text-xs text-cuesheet/40">
                          {meta.label}{shift.staff?.role_title ? ` · ${shift.staff.role_title}` : ''}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Recent ticket sales */}
          <div className="rounded-lg border border-graphite-line bg-riser p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-sm font-medium text-cuesheet">Recent ticket sales</p>
                <p className="mt-0.5 text-xs text-cuesheet/40">Latest activity across all events</p>
              </div>
              <TicketIcon size={16} className="text-cuesheet/25" />
            </div>
            <div className="mt-4 space-y-3">
              {!loading && recentTickets.length === 0 ? (
                <p className="py-4 text-center text-xs text-cuesheet/30">No tickets sold yet</p>
              ) : (
                recentTickets.map((t) => {
                  const meta = ticketStatusMeta(t.status)
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-cuesheet">{t.buyer_name || 'Guest'}</p>
                        <p className="truncate text-xs text-cuesheet/40">
                          {t.ticket_types?.events?.name} · {t.ticket_types?.name}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-mono text-xs text-amber">
                          {t.amount_paid != null ? formatMoney(Number(t.amount_paid)) : '—'}
                        </span>
                        <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[meta.tone]}`} title={meta.label} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <a href="/customers" className="mt-4 flex items-center gap-1 text-xs text-wash hover:text-cuesheet">
              View all customers <ArrowUpRight size={12} />
            </a>
          </div>

          {/* Workspace activity */}
          <div className="rounded-lg border border-graphite-line bg-riser p-5">
            <p className="font-display text-sm font-medium text-cuesheet">Workspace activity</p>
            <p className="mt-0.5 text-xs text-cuesheet/40">Operational signals</p>
            <div className="mt-4 space-y-3">
              {!loading && activity.length === 0 ? (
                <p className="py-4 text-center text-xs text-cuesheet/30">Nothing to report</p>
              ) : (
                activity.map((n) => {
                  const NIcon = NOTIFICATION_ICON[n.type] || Bell
                  return (
                    <div key={n.id} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blackout text-amber/80">
                        <NIcon size={12} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-tight text-cuesheet/85">{n.title}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-cuesheet/30">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}