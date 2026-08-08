import { useEffect, useMemo, useState } from 'react'
import { Wallet, UserCheck, PackageX } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { TopBar } from '../core/layout/TopBar'
import { formatMoney } from '../core/utils'
import type { AppNotification, EventRecord } from '../core/types'
import { Hero } from './Hero'
import { HealthLine } from './HealthLine'
import { ActivityInline } from './ActivityFeed'
import { SalesChart } from './SalesChart'
import { TierDonut } from './TierDonut'
import { RecentSales } from './RecentSales'
import { ActivityFeed } from './ActivityFeed'
import { pctTrend, type DayBucket, type RecentTicket } from './dashboardHelpers'

export function ReportsHome() {
  const { organization } = useAuth()
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  const [liveEvent, setLiveEvent] = useState<EventRecord | null>(null)
  const [nextEvent, setNextEvent] = useState<EventRecord | null>(null)
  const [eventCount, setEventCount] = useState(0)

  const [crewTotal, setCrewTotal] = useState(0)
  const [crewClockedIn, setCrewClockedIn] = useState(0)
  const [crewLateNames, setCrewLateNames] = useState<string[]>([])

  const [lowStockItems, setLowStockItems] = useState<string[]>([])

  const [dailyBuckets, setDailyBuckets] = useState<DayBucket[]>([])
  const [chartWindow, setChartWindow] = useState<7 | 30>(30)
  const [tierRevenue, setTierRevenue] = useState<{ name: string; value: number }[]>([])
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([])
  const [activity, setActivity] = useState<AppNotification[]>([])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!organization) return
    const org = organization
    let cancelled = false

    async function load() {
      setLoading(true)

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
      thirtyDaysAgo.setHours(0, 0, 0, 0)

      const [eventsRes, equipmentRes, ticketsRes, activityRes] = await Promise.all([
        supabase.from('events').select('*').eq('organization_id', org.id),
        supabase.from('equipment').select('id, name, quantity_available, low_stock_threshold').eq('organization_id', org.id),
        supabase
          .from('tickets')
          .select('*, ticket_types!inner(name, price, events!inner(name, organization_id))')
          .eq('ticket_types.events.organization_id', org.id)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(500),
        supabase.from('notifications').select('*').eq('organization_id', org.id).order('created_at', { ascending: false }).limit(5),
      ])

      if (cancelled) return

      const events = (eventsRes.data as EventRecord[]) || []
      setEventCount(events.length)
      const live = events.find((e) => e.status === 'live') || null
      const upcoming = events
        .filter((e) => e.status === 'published' && new Date(e.start_time) > new Date())
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0] || null
      setLiveEvent(live)
      setNextEvent(upcoming)

      const equipment = equipmentRes.data || []
      setLowStockItems(equipment.filter((e) => e.quantity_available <= e.low_stock_threshold).map((e) => e.name))

      const focusEvent = live || upcoming
      if (focusEvent) {
        const { data: shiftData } = await supabase.from('shifts').select('*, staff(full_name)').eq('event_id', focusEvent.id)
        const shifts = shiftData || []
        setCrewTotal(shifts.length)
        setCrewClockedIn(shifts.filter((s) => s.status === 'clocked_in' || s.status === 'on_break').length)
        setCrewLateNames(
          live ? shifts.filter((s) => s.status === 'scheduled').map((s) => (s as any).staff?.full_name).filter(Boolean) : [],
        )
      } else {
        setCrewTotal(0); setCrewClockedIn(0); setCrewLateNames([])
      }

      const tickets = (ticketsRes.data as RecentTicket[]) || []
      const sellable = tickets.filter((t) => t.status === 'valid' || t.status === 'checked_in')

      const buckets: DayBucket[] = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        buckets.push({ date: key, label: d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }), sold: 0, revenue: 0 })
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

      const tierMap = new Map<string, number>()
      for (const t of sellable) {
        const name = t.ticket_types?.name || 'Other'
        tierMap.set(name, (tierMap.get(name) || 0) + (Number(t.amount_paid) || Number(t.ticket_types?.price) || 0))
      }
      const sortedTiers = Array.from(tierMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
      setTierRevenue(sortedTiers.slice(0, 5))

      setRecentTickets(tickets.slice(0, 5))
      setActivity((activityRes.data as AppNotification[]) || [])
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [organization])

  const { revenue7d, revenueTrend } = useMemo(() => {
    if (dailyBuckets.length < 14) return { revenue7d: 0, revenueTrend: undefined }
    const last7 = dailyBuckets.slice(-7)
    const prior7 = dailyBuckets.slice(-14, -7)
    const rev7 = last7.reduce((s, b) => s + b.revenue, 0)
    const revP = prior7.reduce((s, b) => s + b.revenue, 0)
    return { revenue7d: rev7, revenueTrend: pctTrend(rev7, revP) }
  }, [dailyBuckets])

  const chartData = useMemo(() => dailyBuckets.slice(-chartWindow), [dailyBuckets, chartWindow])
  const focusEvent = liveEvent || nextEvent

  return (
    <div>
      <TopBar title="Mission Control" />
      <div className="space-y-6 p-6">
        <Hero loading={loading} liveEvent={liveEvent} nextEvent={nextEvent} now={now} />

        <div className="grid gap-3 md:grid-cols-3">
          <HealthLine
            icon={UserCheck}
            href="/staff"
            tone={crewLateNames.length > 0 ? 'standby' : crewTotal > 0 ? 'amber' : 'graphite'}
            headline={crewTotal === 0 ? 'No crew assigned yet' : `${crewClockedIn} of ${crewTotal} crew checked in`}
            sub={crewLateNames.length > 0 ? `Running late: ${crewLateNames.join(', ')}` : focusEvent ? `For ${focusEvent.name}` : undefined}
          />
          <HealthLine
            icon={PackageX}
            href="/equipment"
            tone={lowStockItems.length > 0 ? 'standby' : 'graphite'}
            headline={lowStockItems.length > 0 ? `${lowStockItems.length} item${lowStockItems.length === 1 ? '' : 's'} running low` : 'Stock levels are fine'}
            sub={lowStockItems.length > 0 ? lowStockItems.slice(0, 3).join(', ') : undefined}
          />
          <HealthLine
            icon={Wallet}
            href="/events"
            tone="amber"
            headline={loading ? 'Loading sales…' : `${formatMoney(revenue7d)} in sales this week`}
            sub={revenueTrend?.label}
          />
        </div>

        {!loading && <ActivityInline activity={activity} />}

        <div>
          <p className="mb-3 font-mono text-label uppercase tracking-widest text-cuesheet/25">Details</p>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SalesChart
              loading={loading}
              eventCount={eventCount}
              dailyBuckets={dailyBuckets}
              chartWindow={chartWindow}
              onWindowChange={setChartWindow}
              chartData={chartData}
            />
            <TierDonut loading={loading} tierRevenue={tierRevenue} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RecentSales loading={loading} recentTickets={recentTickets} />
            <ActivityFeed loading={loading} activity={activity} />
          </div>
        </div>
      </div>
    </div>
  )
}