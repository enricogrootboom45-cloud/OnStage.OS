import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { QRCode } from '../core/components/QRCode'
import { CueLight } from '../core/components/CueLight'
import { formatDateTime } from '../core/utils'
import type { Ticket, TicketType, EventRecord } from '../core/types'

interface FullTicket extends Ticket {
  ticket_types: TicketType & { events: EventRecord }
}

export function TicketView() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<FullTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      const { data } = await supabase
        .from('tickets')
        .select('*, ticket_types(*, events(*))')
        .eq('id', id)
        .maybeSingle()
      if (!data) { setNotFound(true) } else { setTicket(data as FullTicket) }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 size={24} className="animate-spin text-amber" />
    </div>
  )

  if (notFound || !ticket) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <AlertTriangle size={28} className="text-standby" />
      <p className="font-display text-base font-semibold text-cuesheet">Ticket not found</p>
    </div>
  )

  const event = ticket.ticket_types?.events

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-sm">
        <div className="mb-6 text-center">
          <p className="font-display text-sm font-semibold text-cuesheet/40">
            OnStage <span className="text-amber">OS</span>
          </p>
        </div>

        <div className="rounded-xl border border-graphite-line bg-riser">
          <div className="border-b border-graphite-line px-5 py-4">
            <p className="font-display text-lg font-bold text-cuesheet">{event?.name}</p>
            <p className="mt-0.5 text-sm text-cuesheet/55">{ticket.ticket_types?.name}</p>
            {event?.start_time && (
              <p className="mt-1 text-xs text-cuesheet/35">{formatDateTime(event.start_time)}</p>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 px-5 py-6">
            {ticket.status === 'checked_in' ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle size={52} className="text-wash" />
                <CueLight tone="wash" label="Checked in" />
                <p className="text-xs text-cuesheet/40">
                  {ticket.checked_in_at
                    ? `Admitted at ${formatDateTime(ticket.checked_in_at)}`
                    : 'Already admitted'}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-graphite-line bg-cuesheet p-3">
                  <QRCode value={ticket.id} size={200} />
                </div>
                <p className="text-center text-xs text-cuesheet/40">
                  Present this at the door
                </p>
              </>
            )}
          </div>

          {ticket.buyer_name && (
            <div className="border-t border-graphite-line px-5 py-3">
              <p className="text-xs text-cuesheet/35">
                {ticket.buyer_name}
                {ticket.buyer_email ? ` · ${ticket.buyer_email}` : ''}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-cuesheet/25">
                {ticket.id}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
