import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Calendar, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { TopBar } from '../core/layout/TopBar'
import { Button } from '../core/components/Button'
import { EmptyState } from '../core/components/EmptyState'
import { CueLight } from '../core/components/CueLight'
import { Modal, Field, inputClass } from '../core/components/Modal'
import { eventStatusMeta } from '../core/statusMeta'
import { formatDateTime } from '../core/utils'
import type { EventRecord, EventStatus, Venue } from '../core/types'

export function EventsList() {
  const { organization } = useAuth()
  const [events, setEvents] = useState<EventRecord[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    if (!organization) return
    setLoading(true)
    const [eventsRes, venuesRes] = await Promise.all([
      supabase
        .from('events')
        .select('*')
        .eq('organization_id', organization.id)
        .order('start_time', { ascending: true }),
      supabase.from('venues').select('*').eq('organization_id', organization.id),
    ])
    setEvents((eventsRes.data as EventRecord[]) || [])
    setVenues((venuesRes.data as Venue[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization])

  function venueName(id: string | null) {
    return venues.find((v) => v.id === id)?.name || 'No venue set'
  }

  return (
    <div>
      <TopBar title="Events" />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-cuesheet/45">
            {events.length} event{events.length === 1 ? '' : 's'} on the books
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={15} /> New event
          </Button>
        </div>

        {!loading && events.length === 0 ? (
          <EmptyState
            icon={<Calendar size={28} />}
            title="No events yet"
            body="Create your first show — venue, staffing, equipment, and tickets all hang off it."
            action={
              <Button onClick={() => setShowForm(true)} variant="secondary">
                <Plus size={15} /> New event
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-graphite-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-riser text-xs uppercase tracking-wide text-cuesheet/40">
                <tr>
                  <th className="px-4 py-3 font-normal">Event</th>
                  <th className="px-4 py-3 font-normal">Venue</th>
                  <th className="px-4 py-3 font-normal">Starts</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const meta = eventStatusMeta(event.status)
                  return (
                    <tr key={event.id} className="border-t border-graphite-line/70 transition-colors hover:bg-riser/60">
                      <td className="px-4 py-3">
                        <Link
                          to={`/events/${event.id}`}
                          className="font-medium text-cuesheet hover:text-amber-bright"
                        >
                          {event.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-cuesheet/60">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={13} className="text-cuesheet/30" />
                          {venueName(event.venue_id)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-cuesheet/60">
                        {formatDateTime(event.start_time)}
                      </td>
                      <td className="px-4 py-3">
                        <CueLight tone={meta.tone} label={meta.label} pulse={meta.pulse} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <NewEventModal
          organizationId={organization!.id}
          venues={venues}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function NewEventModal({
  organizationId,
  venues,
  onClose,
  onCreated,
}: {
  organizationId: string
  venues: Venue[]
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [venueId, setVenueId] = useState('')
  const [startTime, setStartTime] = useState('')
  const [status, setStatus] = useState<EventStatus>('draft')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.from('events').insert({
      organization_id: organizationId,
      venue_id: venueId || null,
      name,
      start_time: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
      status,
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    onCreated()
  }

  return (
    <Modal title="New event" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Event name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Tableview Sessions Vol. 4"
          />
        </Field>
        <Field label="Venue">
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className={inputClass}
          >
            <option value="">No venue yet</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start date & time">
          <input
            required
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EventStatus)}
            className={inputClass}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
        </Field>
        {error && <p className="mb-3 text-sm text-standby">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Creating…' : 'Create event'}
        </Button>
      </form>
    </Modal>
  )
}
