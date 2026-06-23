import { useEffect, useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, MapPin, Ticket, Loader2, AlertTriangle } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../core/supabaseClient'
import { Button } from '../core/components/Button'
import { Modal, Field, inputClass } from '../core/components/Modal'
import { CueLight } from '../core/components/CueLight'
import { eventStatusMeta } from '../core/statusMeta'
import { formatDateTime, formatMoney } from '../core/utils'
import type { EventRecord, Venue, TicketType } from '../core/types'

interface BuyState {
  ticketType: TicketType
  qty: number
}

export function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [venue, setVenue] = useState<Venue | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [buying, setBuying] = useState<BuyState | null>(null)

  useEffect(() => {
    if (!slug) return
    async function load() {
      setLoading(true)
      const { data: ev } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .in('status', ['published', 'live'])
        .maybeSingle()

      if (!ev) { setNotFound(true); setLoading(false); return }
      setEvent(ev as EventRecord)

      const [venueRes, typesRes] = await Promise.all([
        ev.venue_id
          ? supabase.from('venues').select('*').eq('id', ev.venue_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('ticket_types').select('*').eq('event_id', ev.id).order('price'),
      ])
      setVenue(venueRes.data as Venue | null)
      setTicketTypes((typesRes.data as TicketType[]) || [])
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 size={24} className="animate-spin text-amber" />
    </div>
  )

  if (notFound || !event) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <AlertTriangle size={28} className="text-standby" />
      <p className="font-display text-lg font-semibold text-cuesheet">Event not found</p>
      <p className="text-sm text-cuesheet/45">This event may no longer be available.</p>
    </div>
  )

  const meta = eventStatusMeta(event.status)
  const hasTickets = ticketTypes.length > 0
  const allSoldOut = hasTickets && ticketTypes.every(
    tt => tt.quantity_total !== null && tt.quantity_sold >= tt.quantity_total
  )

  return (
    <div className="min-h-screen px-4 py-10">
      {/* Branding */}
      <div className="mx-auto mb-8 max-w-xl text-center">
        <p className="font-display text-sm font-semibold text-cuesheet/40">
          OnStage <span className="text-amber">OS</span>
        </p>
      </div>

      <div className="mx-auto max-w-xl">
        {/* Event card */}
        <div className="mb-6 rounded-xl border border-graphite-line bg-riser p-6">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-bold leading-tight text-cuesheet">
              {event.name}
            </h1>
            <CueLight tone={meta.tone} label={meta.label} pulse={meta.pulse} />
          </div>

          {event.description && (
            <p className="mb-4 text-sm leading-relaxed text-cuesheet/60">
              {event.description}
            </p>
          )}

          <div className="space-y-2 text-sm text-cuesheet/55">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="shrink-0 text-cuesheet/30" />
              {formatDateTime(event.start_time)}
            </div>
            {venue && (
              <div className="flex items-center gap-2">
                <MapPin size={15} className="shrink-0 text-cuesheet/30" />
                {venue.name}
                {venue.address ? ` — ${venue.address}` : ''}
              </div>
            )}
          </div>
        </div>

        {/* Ticket tiers */}
        <div className="mb-4">
          <p className="mb-3 font-display text-sm font-medium text-cuesheet">
            Tickets
          </p>

          {!hasTickets ? (
            <p className="text-sm text-cuesheet/40">No tickets available yet — check back soon.</p>
          ) : allSoldOut ? (
            <p className="text-sm text-standby">This event is sold out.</p>
          ) : (
            <div className="space-y-3">
              {ticketTypes.map((tt) => {
                const remaining = tt.quantity_total !== null
                  ? tt.quantity_total - tt.quantity_sold
                  : null
                const soldOut = remaining !== null && remaining <= 0
                return (
                  <div
                    key={tt.id}
                    className="flex items-center justify-between rounded-lg border border-graphite-line bg-riser p-4"
                  >
                    <div>
                      <p className="font-display text-sm font-medium text-cuesheet">{tt.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-cuesheet/40">
                        {remaining !== null
                          ? soldOut ? 'Sold out' : `${remaining} remaining`
                          : 'Available'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-medium text-amber">
                        {formatMoney(Number(tt.price))}
                      </span>
                      <Button
                        disabled={soldOut}
                        onClick={() => setBuying({ ticketType: tt, qty: 1 })}
                        variant={soldOut ? 'secondary' : 'primary'}
                      >
                        {soldOut ? 'Sold out' : 'Buy'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-cuesheet/25">
          Powered by OnStage OS · Cape Town
        </p>
      </div>

      {buying && (
        <CheckoutModal
          event={event}
          ticketType={buying.ticketType}
          onClose={() => setBuying(null)}
        />
      )}
    </div>
  )
}

function CheckoutModal({
  event,
  ticketType,
  onClose,
}: {
  event: EventRecord
  ticketType: TicketType
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
      if (!stripeKey) throw new Error('Payments are not configured yet. Please try again later.')

      // Call Supabase Edge Function to create a Stripe Checkout Session
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: {
          ticket_type_id: ticketType.id,
          event_name: event.name,
          ticket_name: ticketType.name,
          price: ticketType.price,
          buyer_name: name,
          buyer_email: email,
          success_url: `${window.location.origin}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: window.location.href,
        },
      })

      if (fnError) throw new Error(fnError.message)
      if (!data?.url) throw new Error('Could not create checkout session')

      const stripe = await loadStripe(stripeKey)
      if (!stripe) throw new Error('Stripe failed to load')

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <Modal title={`Buy — ${ticketType.name}`} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between rounded-md bg-blackout px-3 py-2">
        <span className="text-sm text-cuesheet/60">{ticketType.name}</span>
        <span className="font-mono text-sm font-medium text-amber">
          {formatMoney(Number(ticketType.price))}
        </span>
      </div>
      <form onSubmit={handleSubmit}>
        <Field label="Your name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Full name"
          />
        </Field>
        <Field label="Email address">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="Your email for the ticket"
          />
        </Field>
        {error && (
          <p className="mb-3 flex items-center gap-1.5 text-sm text-standby">
            <AlertTriangle size={14} /> {error}
          </p>
        )}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? (
            <><Loader2 size={15} className="animate-spin" /> Redirecting to payment…</>
          ) : (
            <>
              <Ticket size={15} />
              Pay {formatMoney(Number(ticketType.price))} with Stripe
            </>
          )}
        </Button>
        <p className="mt-3 text-center text-xs text-cuesheet/30">
          Secure payment powered by Stripe
        </p>
      </form>
    </Modal>
  )
}
