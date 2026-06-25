import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { Button } from '../core/components/Button'
import { Modal, Field, inputClass } from '../core/components/Modal'
import { formatMoney } from '../core/utils'
import type { EventCost, TicketType } from '../core/types'

const CATEGORIES = ['Venue', 'Staff', 'Equipment', 'Marketing', 'Production', 'Other']

export function EventPnL({ eventId }: { eventId: string }) {
  const [costs,       setCosts]       = useState<EventCost[]>([])
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [showForm,    setShowForm]    = useState(false)
  const [loading,     setLoading]     = useState(true)

  async function load() {
    setLoading(true)
    const [costsRes, typesRes] = await Promise.all([
      supabase.from('event_costs').select('*').eq('event_id', eventId).order('created_at'),
      supabase.from('ticket_types').select('*').eq('event_id', eventId),
    ])
    setCosts((costsRes.data as EventCost[]) || [])
    setTicketTypes((typesRes.data as TicketType[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [eventId]) // eslint-disable-line

  async function deleteCost(id: string) {
    await supabase.from('event_costs').delete().eq('id', id)
    setCosts((prev) => prev.filter((c) => c.id !== id))
  }

  const revenue    = ticketTypes.reduce((s, tt) => s + Number(tt.price) * tt.quantity_sold, 0)
  const totalCosts = costs.reduce((s, c) => s + Number(c.amount), 0)
  const profit     = revenue - totalCosts
  const margin     = revenue > 0 ? Math.round((profit / revenue) * 100) : null

  if (loading) return null

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-sm font-medium text-cuesheet">P&amp;L</p>
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Add cost
        </Button>
      </div>

      <div className="rounded-lg border border-graphite-line bg-riser">
        {/* Revenue row */}
        <div className="flex items-center justify-between border-b border-graphite-line px-4 py-3">
          <span className="text-sm text-cuesheet/60">Ticket revenue</span>
          <span className="font-mono text-sm font-medium text-amber">
            {formatMoney(revenue)}
          </span>
        </div>

        {/* Cost line items */}
        {costs.length === 0 ? (
          <div className="px-4 py-3">
            <p className="text-xs text-cuesheet/30">
              No costs added yet — add venue hire, staff pay, equipment, etc.
            </p>
          </div>
        ) : (
          costs.map((cost) => (
            <div
              key={cost.id}
              className="flex items-center justify-between border-b border-graphite-line/60 px-4 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm text-cuesheet/80">{cost.description}</p>
                {cost.category && (
                  <p className="text-xs text-cuesheet/35">{cost.category}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-standby">
                  -{formatMoney(Number(cost.amount))}
                </span>
                <button
                  onClick={() => deleteCost(cost.id)}
                  className="text-cuesheet/20 hover:text-standby"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Totals */}
        <div className="border-t border-graphite-line bg-blackout/40 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-semibold text-cuesheet">
              {profit >= 0 ? 'Profit' : 'Loss'}
            </span>
            <div className="flex items-center gap-2">
              {margin !== null && (
                <span className="font-mono text-xs text-cuesheet/40">
                  {margin}% margin
                </span>
              )}
              <span
                className={[
                  'flex items-center gap-1 font-mono text-base font-bold',
                  profit >= 0 ? 'text-wash' : 'text-standby',
                ].join(' ')}
              >
                {profit >= 0
                  ? <TrendingUp size={15} />
                  : <TrendingDown size={15} />
                }
                {formatMoney(Math.abs(profit))}
              </span>
            </div>
          </div>
          {totalCosts > 0 && (
            <p className="mt-0.5 text-right font-mono text-xs text-cuesheet/30">
              {formatMoney(totalCosts)} total costs
            </p>
          )}
        </div>
      </div>

      {showForm && (
        <AddCostModal
          eventId={eventId}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}

function AddCostModal({
  eventId, onClose, onCreated,
}: {
  eventId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [description, setDescription] = useState('')
  const [amount,      setAmount]      = useState('')
  const [category,    setCategory]    = useState('Other')
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: err } = await supabase.from('event_costs').insert({
      event_id: eventId,
      description,
      amount: Number(amount) || 0,
      category,
    })
    setSubmitting(false)
    if (err) { setError(err.message); return }
    onCreated()
  }

  return (
    <Modal title="Add cost" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Description">
          <input
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
            placeholder="e.g. Venue hire, DJ fee, Marketing"
          />
        </Field>
        <Field label="Amount (ZAR)">
          <input
            required
            type="number"
            min={0}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
            placeholder="0"
          />
        </Field>
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        {error && <p className="mb-3 text-sm text-standby">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Adding…' : 'Add cost'}
        </Button>
      </form>
    </Modal>
  )
}
