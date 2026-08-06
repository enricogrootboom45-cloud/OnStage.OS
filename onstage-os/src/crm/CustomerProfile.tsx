import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Ticket as TicketIcon } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { TopBar } from '../core/layout/TopBar'
import { CueLight } from '../core/components/CueLight'
import { ticketStatusMeta } from '../core/statusMeta'
import { formatDateTime, formatMoney } from '../core/utils'
import type { Customer, Ticket, TicketType, EventRecord } from '../core/types'

interface FullTicket extends Ticket {
  ticket_types: TicketType & { events: EventRecord }
}

export function CustomerProfile() {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [tickets, setTickets] = useState<FullTicket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      const [custRes, tickRes] = await Promise.all([
        supabase.from('customers').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('tickets')
          .select('*, ticket_types(*, events(*))')
          .eq('customer_id', id)
          .order('created_at', { ascending: false }),
      ])
      setCustomer(custRes.data as Customer | null)
      setTickets((tickRes.data as FullTicket[]) || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="p-6 text-sm text-cuesheet/40">Loading customer…</div>
  if (!customer) return <div className="p-6 text-sm text-cuesheet/40">Customer not found.</div>

  const totalSpend = tickets
    .filter((t) => t.status === 'valid' || t.status === 'checked_in')
    .reduce((sum, t) => sum + (Number(t.amount_paid) || 0), 0)

  const eventsAttended = new Set(
    tickets
      .filter((t) => t.status === 'checked_in')
      .map((t) => t.ticket_types?.events?.id)
      .filter(Boolean)
  ).size

  return (
    <div>
      <TopBar title={customer.full_name || customer.email || 'Customer'} />
      <div className="p-4 lg:p-6">
        <Link
          to="/customers"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-cuesheet/45 hover:text-cuesheet"
        >
          <ArrowLeft size={15} /> All audience
        </Link>

        {/* Profile header */}
        <div className="mb-6 rounded-lg border border-graphite-line bg-riser p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-xl font-bold text-cuesheet">
                {customer.full_name || '—'}
              </p>
              <p className="mt-0.5 text-sm text-cuesheet/55">{customer.email || '—'}</p>
              {customer.phone && (
                <p className="mt-0.5 text-sm text-cuesheet/40">{customer.phone}</p>
              )}
            </div>
            {customer.source && (
              <span className="rounded-full border border-graphite-line px-3 py-1 font-mono text-xs text-cuesheet/40">
                {customer.source}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-graphite-line pt-4">
            <div className="text-center">
              <p className="font-display text-xl font-bold text-amber">
                {formatMoney(totalSpend)}
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-cuesheet/35">
                Total spend
              </p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl font-bold text-cuesheet">{tickets.length}</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-cuesheet/35">
                Tickets bought
              </p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl font-bold text-cuesheet">{eventsAttended}</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-cuesheet/35">
                Events attended
              </p>
            </div>
          </div>
        </div>

        {/* Ticket history */}
        <p className="mb-3 font-display text-sm font-medium text-cuesheet">
          Purchase history
        </p>

        {tickets.length === 0 ? (
          <div className="rounded-lg border border-dashed border-graphite-line p-8 text-center">
            <TicketIcon size={24} className="mx-auto mb-3 text-cuesheet/20" />
            <p className="text-sm text-cuesheet/40">No tickets yet</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-graphite-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-riser text-xs uppercase tracking-wide text-cuesheet/40">
                <tr>
                  <th className="px-4 py-3 font-normal">Event</th>
                  <th className="px-4 py-3 font-normal">Tier</th>
                  <th className="px-4 py-3 font-normal">Paid</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal">Date</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => {
                  const meta = ticketStatusMeta(t.status)
                  return (
                    <tr key={t.id} className="border-t border-graphite-line/70">
                      <td className="px-4 py-3 text-cuesheet">
                        {t.ticket_types?.events?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-cuesheet/60">
                        {t.ticket_types?.name || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-cuesheet/70">
                        {t.amount_paid != null ? formatMoney(Number(t.amount_paid)) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <CueLight tone={meta.tone} label={meta.label} />
                      </td>
                      <td className="px-4 py-3 text-cuesheet/45">
                        {formatDateTime(t.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}