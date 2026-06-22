import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Ticket, Trash2 } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { Button } from '../core/components/Button'
import { EmptyState } from '../core/components/EmptyState'
import { Modal, Field, inputClass } from '../core/components/Modal'
import { formatMoney } from '../core/utils'
import type { TicketType } from '../core/types'

export function TicketTypesPanel({ eventId }: { eventId: string }) {
  const [types, setTypes] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', eventId)
      .order('price')
    setTypes((data as TicketType[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function deleteType(id: string) {
    if (!window.confirm('Delete this ticket type? This cannot be undone if tickets have been sold.')) return
    await supabase.from('ticket_types').delete().eq('id', id)
    load()
  }

  const totalSold  = types.reduce((s, t) => s + t.quantity_sold, 0)
  const totalRevenue = types.reduce((s, t) => s + Number(t.price) * t.quantity_sold, 0)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-sm font-medium text-cuesheet">Ticket types</p>
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Add tier
        </Button>
      </div>

      {!loading && types.length === 0 ? (
        <EmptyState
          icon={<Ticket size={22} />}
          title="No ticket tiers yet"
          body="Add GA, VIP, Early Bird — each tier tracks its own sales and revenue."
          action={
            <Button variant="secondary" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Add tier
            </Button>
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-graphite-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-riser text-xs uppercase tracking-wide text-cuesheet/40">
                <tr>
                  <th className="px-4 py-2 font-normal">Tier</th>
                  <th className="px-4 py-2 font-normal">Price</th>
                  <th className="px-4 py-2 font-normal">Sold / Total</th>
                  <th className="px-4 py-2 font-normal">Revenue</th>
                  <th className="px-4 py-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {types.map((tt) => (
                  <tr key={tt.id} className="border-t border-graphite-line/70">
                    <td className="px-4 py-2.5 text-cuesheet">{tt.name}</td>
                    <td className="px-4 py-2.5 font-mono text-cuesheet/70">
                      {formatMoney(Number(tt.price))}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-cuesheet/70">
                      {tt.quantity_sold} / {tt.quantity_total ?? '∞'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-amber">
                      {formatMoney(Number(tt.price) * tt.quantity_sold)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {tt.quantity_sold === 0 && (
                        <button
                          onClick={() => deleteType(tt.id)}
                          className="text-cuesheet/30 hover:text-standby"
                          aria-label="Delete tier"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-graphite-line bg-riser">
                <tr>
                  <td className="px-4 py-2 font-mono text-xs text-cuesheet/40" colSpan={2}>
                    Total
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-cuesheet/60">{totalSold}</td>
                  <td className="px-4 py-2 font-mono text-xs text-amber">
                    {formatMoney(totalRevenue)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <NewTicketTypeModal
          eventId={eventId}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}

function NewTicketTypeModal({
  eventId, onClose, onCreated,
}: {
  eventId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [quantityTotal, setQuantityTotal] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.from('ticket_types').insert({
      event_id: eventId,
      name,
      price: Number(price) || 0,
      quantity_total: quantityTotal ? Number(quantityTotal) : null,
    })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    onCreated()
  }

  return (
    <Modal title="Add ticket tier" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Tier name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. General Admission, VIP, Early Bird"
          />
        </Field>
        <Field label="Price (ZAR)">
          <input
            required
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
            placeholder="0"
          />
        </Field>
        <Field label="Quantity (leave blank for unlimited)">
          <input
            type="number"
            min={1}
            value={quantityTotal}
            onChange={(e) => setQuantityTotal(e.target.value)}
            className={inputClass}
            placeholder="e.g. 500"
          />
        </Field>
        {error && <p className="mb-3 text-sm text-standby">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Adding…' : 'Add tier'}
        </Button>
      </form>
    </Modal>
  )
}
