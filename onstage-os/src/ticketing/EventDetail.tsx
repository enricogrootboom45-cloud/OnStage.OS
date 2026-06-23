import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, ExternalLink, ScanLine, Copy, Check } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { TopBar } from '../core/layout/TopBar'
import { CueLight } from '../core/components/CueLight'
import { Button } from '../core/components/Button'
import { eventStatusMeta } from '../core/statusMeta'
import { formatDateTime } from '../core/utils'
import { TicketTypesPanel } from './TicketTypesPanel'
import type { EventRecord, Venue } from '../core/types'

const APP_URL =
  import.meta.env.VITE_APP_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://on-stage-os.vercel.app')

export function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      const { data: ev } = await supabase.from('events').select('*').eq('id', id).maybeSingle()
      if (ev) {
        setEvent(ev as EventRecord)
        if ((ev as EventRecord).venue_id) {
          const { data: v } = await supabase
            .from('venues')
            .select('*')
            .eq('id', (ev as EventRecord).venue_id!)
            .maybeSingle()
          setVenue(v as Venue | null)
        }
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function copyLink() {
    if (!event?.slug) return
    const url = `${APP_URL}/e/${event.slug}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) return <div className="p-6 text-sm text-cuesheet/40">Loading event…</div>
  if (!event)  return <div className="p-6 text-sm text-cuesheet/40">Event not found.</div>

  const meta = eventStatusMeta(event.status)
  const publicUrl = event.slug ? `${APP_URL}/e/${event.slug}` : null
  const isPublic  = event.status === 'published' || event.status === 'live'

  return (
    <div>
      <TopBar title={event.name} />
      <div className="p-4 lg:p-6">
        <Link
          to="/events"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-cuesheet/45 hover:text-cuesheet"
        >
          <ArrowLeft size={15} /> All events
        </Link>

        {/* Event meta card */}
        <div className="mb-6 rounded-lg border border-graphite-line bg-riser p-4 lg:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold text-cuesheet">{event.name}</p>
              {event.description && (
                <p className="mt-1 text-sm text-cuesheet/55">{event.description}</p>
              )}
            </div>
            <CueLight tone={meta.tone} label={meta.label} pulse={meta.pulse} />
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-cuesheet/55">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-cuesheet/30" />
              {formatDateTime(event.start_time)}
            </span>
            {venue && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} className="text-cuesheet/30" />
                {venue.name}
                {venue.address ? ` — ${venue.address}` : ''}
              </span>
            )}
          </div>

          {/* Action row */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-graphite-line pt-4">
            {/* Public event link */}
            {publicUrl && isPublic ? (
              <>
                <Button
                  variant="secondary"
                  onClick={copyLink}
                  className="gap-1.5"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy public link'}
                </Button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" className="gap-1.5">
                    <ExternalLink size={14} /> Preview page
                  </Button>
                </a>
              </>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-cuesheet/30">
                <ExternalLink size={13} />
                Publish this event to get a shareable ticket link
              </p>
            )}

            {/* Door scanner shortcut */}
            <Link to="/scan" className="ml-auto">
              <Button variant="secondary" className="gap-1.5">
                <ScanLine size={14} /> Door scanner
              </Button>
            </Link>
          </div>
        </div>

        {/* Ticket types */}
        <TicketTypesPanel eventId={event.id} />
      </div>
    </div>
  )
}
