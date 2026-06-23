import { useEffect, useState } from 'react'
import { BarChart3, Wallet, Ticket as TicketIcon, UserCheck, PackageX } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { TopBar } from '../core/layout/TopBar'
import { StatCard } from '../core/components/StatCard'
import { EmptyState } from '../core/components/EmptyState'
import { formatMoney } from '../core/utils'

interface EventSales {
  name: string
  tickets: number
}

export function ReportsHome() {
  const { organization } = useAuth()
  const [loading, setLoading] = useState(true)
  const [eventCount, setEventCount] = useState(0)
  const [liveEventCount, setLiveEventCount] = useState(0)
  const [staffClockedIn, setStaffClockedIn] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [revenue, setRevenue] = useState(0)
  const [ticketsSold, setTicketsSold] = useState(0)
  const [salesByEvent, setSalesByEvent] = useState<EventSales[]>([])

  useEffect(() => {
    if (!organization) return
    let cancelled = false

    async function load() {
      setLoading(true)

      const [eventsRes, shiftsRes, equipmentRes, ticketTypesRes] = await Promise.all([
        supabase.from('events').select('id, name, status').eq('organization_id', organization!.id),
        supabase
          .from('shifts')
          .select('id, status, events!inner(organization_id)')
          .eq('status', 'clocked_in')
          .eq('events.organization_id', organization!.id),
        supabase
          .from('equipment')
          .select('id, quantity_available, low_stock_threshold')
          .eq('organization_id', organization!.id),
        supabase
          .from('ticket_types')
          .select('price, quantity_sold, events!inner(organization_id, name)')
          .eq('events.organization_id', organization!.id),
      ])

      if (cancelled) return

      const events = eventsRes.data || []
      setEventCount(events.length)
      setLiveEventCount(events.filter((e) => e.status === 'live').length)
      setStaffClockedIn(shiftsRes.data?.length || 0)

      const equipment = equipmentRes.data || []
      setLowStockCount(
        equipment.filter((e) => e.quantity_available <= e.low_stock_threshold).length,
      )

      const ticketTypes = (ticketTypesRes.data || []) as Array<{
        price: number
        quantity_sold: number
        events: { name: string } | { name: string }[]
      }>
      let rev = 0
      let sold = 0
      const byEvent = new Map<string, number>()
      for (const tt of ticketTypes) {
        rev += Number(tt.price) * tt.quantity_sold
        sold += tt.quantity_sold
        const eventObj = Array.isArray(tt.events) ? tt.events[0] : tt.events
        const name = eventObj?.name || 'Untitled event'
        byEvent.set(name, (byEvent.get(name) || 0) + tt.quantity_sold)
      }
      setRevenue(rev)
      setTicketsSold(sold)
      setSalesByEvent(Array.from(byEvent, ([name, tickets]) => ({ name, tickets })))

      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [organization])

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard
            label="Revenue"
            value={loading ? '—' : formatMoney(revenue)}
            hint={`${eventCount} event${eventCount === 1 ? '' : 's'} total`}
            icon={<Wallet size={16} />}
          />
          <StatCard
            label="Tickets sold"
            value={loading ? '—' : String(ticketsSold)}
            icon={<TicketIcon size={16} />}
          />
          <StatCard
            label="Live now"
            value={loading ? '—' : String(liveEventCount)}
            hint={liveEventCount > 0 ? 'In progress' : 'Nothing on stage'}
            icon={<BarChart3 size={16} />}
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

        <div className="mt-6 rounded-lg border border-graphite-line bg-riser p-5">
          <p className="mb-4 font-display text-sm font-medium text-cuesheet">
            Tickets sold by event
          </p>
          {!loading && salesByEvent.length === 0 ? (
            <EmptyState
              title="No ticket sales yet"
              body="Once events go on sale, this chart fills in automatically — no setup needed."
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByEvent}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#332F25" />
                  <XAxis
                    dataKey="name"
                    stroke="#5A5544"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis stroke="#5A5544" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1E1B14',
                      border: '1px solid #332F25',
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#F6F2E7' }}
                  />
                  <Bar dataKey="tickets" fill="#E8893A" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
