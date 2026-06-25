import { useEffect, useState, type FormEvent } from 'react'
import { Plus, MapPin, Users } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { TopBar } from '../core/layout/TopBar'
import { Button } from '../core/components/Button'
import { EmptyState } from '../core/components/EmptyState'
import { Modal, Field, inputClass } from '../core/components/Modal'
import type { Venue } from '../core/types'

export function VenuesList() {
  const { organization } = useAuth()
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    if (!organization) return
    setLoading(true)
    const { data } = await supabase
      .from('venues')
      .select('*')
      .eq('organization_id', organization.id)
      .order('name')
    setVenues((data as Venue[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization])

  return (
    <div>
      <TopBar title="Venues" />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-cuesheet/45">
            {venues.length} venue{venues.length === 1 ? '' : 's'} on file
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={15} /> Add venue
          </Button>
        </div>

        {!loading && venues.length === 0 ? (
          <EmptyState
            icon={<MapPin size={28} />}
            title="No venues yet"
            body="Add the rooms, halls, and fields you run events in — capacity and on-site contacts in one place."
            action={
              <Button onClick={() => setShowForm(true)} variant="secondary">
                <Plus size={15} /> Add venue
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => (
              <div
                key={venue.id}
                className="rounded-lg border border-graphite-line bg-riser p-4"
              >
                <p className="font-display text-sm font-medium text-cuesheet">{venue.name}</p>
                {venue.address && (
                  <p className="mt-1 text-xs text-cuesheet/45">{venue.address}</p>
                )}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-cuesheet/50">
                  <Users size={13} />
                  {venue.capacity ? `${venue.capacity} capacity` : 'Capacity not set'}
                </div>
                {venue.contact_name && (
                  <p className="mt-2 text-xs text-cuesheet/35">
                    {venue.contact_name}
                    {venue.contact_phone ? ` · ${venue.contact_phone}` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <NewVenueModal
          organizationId={organization!.id}
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

function NewVenueModal({
  organizationId,
  onClose,
  onCreated,
}: {
  organizationId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [capacity, setCapacity] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.from('venues').insert({
      organization_id: organizationId,
      name,
      address: address || null,
      capacity: capacity ? Number(capacity) : null,
      contact_name: contactName || null,
      contact_phone: contactPhone || null,
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    onCreated()
  }

  return (
    <Modal title="Add venue" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Venue name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Maboneng Yard"
          />
        </Field>
        <Field label="Address">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
            placeholder="Street, city"
          />
        </Field>
        <Field label="Capacity">
          <input
            type="number"
            min={0}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className={inputClass}
            placeholder="e.g. 2000"
          />
        </Field>
        <Field label="On-site contact">
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className={inputClass}
            placeholder="Contact name"
          />
        </Field>
        <Field label="Contact phone">
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className={inputClass}
            placeholder="+27…"
          />
        </Field>
        {error && <p className="mb-3 text-sm text-standby">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Adding…' : 'Add venue'}
        </Button>
      </form>
    </Modal>
  )
}
