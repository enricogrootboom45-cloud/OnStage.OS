import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Loader2, AlertTriangle, Download } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { QRCode } from '../core/components/QRCode'
import { Button } from '../core/components/Button'
import type { Ticket, TicketType, EventRecord } from '../core/types'

interface FullTicket extends Ticket {
  ticket_types: TicketType & { events: EventRecord }
}

export function TicketSuccess() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')

  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<FullTicket | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) { setError('No session ID in URL.'); setLoading(false); return }

    async function fulfill() {
      setLoading(true)
      try {
        // Call the fulfill-order edge function
        const { data, error: fnError } = await supabase.functions.invoke('fulfill-order', {
          body: { session_id: sessionId },
        })
        if (fnError) throw new Error(fnError.message)
        if (!data?.ticket_id) throw new Error('Could not create your ticket.')

        // Fetch the ticket with nested ticket type + event
        const { data: t, error: tErr } = await supabase
          .from('tickets')
          .select('*, ticket_types(*, events(*))')
          .eq('id', data.ticket_id)
          .maybeSingle()

        if (tErr || !t) throw new Error('Could not load ticket details.')
        setTicket(t as FullTicket)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    fulfill()
  }, [sessionId])

  if (loading) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2 size={28} className="animate-spin text-amber" />
      <p className="font-mono text-xs uppercase tracking-widest text-cuesheet/40">
        Confirming payment…
      </p>
    </div>
  )

  if (error || !ticket) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <AlertTriangle size={28} className="text-standby" />
      <p className="font-display text-base font-semibold text-cuesheet">Something went wrong</p>
      <p className="max-w-sm text-sm text-cuesheet/50">{error}</p>
      <p className="mt-2 text-xs text-cuesheet/30">
        Your payment may still have succeeded — check your email or contact support.
      </p>
    </div>
  )

  const event = ticket.ticket_types?.events
  const tierName = ticket.ticket_types?.name

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-sm">
        {/* Header */}
        <div className="mb-6 text-center">
          <p className="font-display text-sm font-semibold text-cuesheet/40">
            OnStage <span className="text-amber">OS</span>
          </p>
        </div>

        {/* Success card */}
        <div className="rounded-xl border border-graphite-line bg-riser">
          {/* Top banner */}
          <div className="flex items-center gap-2 border-b border-graphite-line px-5 py-4">
            <CheckCircle size={18} className="text-wash" />
            <p className="font-display text-sm font-semibold text-cuesheet">
              Payment confirmed
            </p>
          </div>

          {/* Event info */}
          <div className="border-b border-graphite-line px-5 py-4">
            <p className="font-display text-lg font-bold text-cuesheet">{event?.name}</p>
            <p className="mt-1 text-sm text-cuesheet/55">{tierName}</p>
            {ticket.buyer_name && (
              <p className="mt-2 text-xs text-cuesheet/40">
                {ticket.buyer_name} · {ticket.buyer_email}
              </p>
            )}
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-3 px-5 py-6">
            <div className="rounded-xl border border-graphite-line bg-cuesheet p-3">
              <QRCode value={ticket.id} size={200} />
            </div>
            <p className="max-w-xs text-center text-xs text-cuesheet/40">
              Show this QR code at the door. Your ticket ID is{' '}
              <span className="font-mono text-cuesheet/60">
                {ticket.id.split('-')[0]}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="border-t border-graphite-line px-5 pb-5 pt-4">
            <Link to={`/t/${ticket.id}`} className="block">
              <Button variant="secondary" className="w-full">
                <Download size={15} /> Save ticket page
              </Button>
            </Link>
            {ticket.buyer_email && (
              <p className="mt-3 text-center text-xs text-cuesheet/35">
                A copy was emailed to {ticket.buyer_email}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
