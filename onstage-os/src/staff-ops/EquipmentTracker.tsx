import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Package, Minus, PlusCircle } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { TopBar } from '../core/layout/TopBar'
import { Button } from '../core/components/Button'
import { EmptyState } from '../core/components/EmptyState'
import { CueLight } from '../core/components/CueLight'
import { Modal, Field, inputClass } from '../core/components/Modal'
import { stockMeta } from '../core/statusMeta'
import type { Equipment } from '../core/types'

export function EquipmentTracker() {
  const { organization } = useAuth()
  const [items, setItems] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    if (!organization) return
    setLoading(true)
    const { data } = await supabase
      .from('equipment')
      .select('*')
      .eq('organization_id', organization.id)
      .order('name')
    setItems((data as Equipment[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization])

  async function adjust(item: Equipment, delta: number, changeType: 'sold' | 'restock') {
    const nextAvailable = Math.max(0, item.quantity_available + delta)
    await supabase.from('equipment').update({ quantity_available: nextAvailable }).eq('id', item.id)
    await supabase.from('equipment_logs').insert({
      equipment_id: item.id,
      change_type: changeType,
      quantity: Math.abs(delta),
    })
    load()
  }

  return (
    <div>
      <TopBar title="Equipment" />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-cuesheet/45">
            {items.length} item{items.length === 1 ? '' : 's'} tracked
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={15} /> Add item
          </Button>
        </div>

        {!loading && items.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title="No equipment tracked yet"
            body="Add gear, bar stock, or rentals — set a low-stock threshold and the dashboard flags it automatically."
            action={
              <Button onClick={() => setShowForm(true)} variant="secondary">
                <Plus size={15} /> Add item
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-graphite-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-riser text-xs uppercase tracking-wide text-cuesheet/40">
                <tr>
                  <th className="px-4 py-3 font-normal">Item</th>
                  <th className="px-4 py-3 font-normal">Category</th>
                  <th className="px-4 py-3 font-normal">Available</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal">Log</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const meta = stockMeta(item.quantity_available, item.low_stock_threshold)
                  return (
                    <tr key={item.id} className="border-t border-graphite-line/70">
                      <td className="px-4 py-3 text-cuesheet">{item.name}</td>
                      <td className="px-4 py-3 text-cuesheet/55">{item.category || '—'}</td>
                      <td className="px-4 py-3 font-mono text-cuesheet/70">
                        {item.quantity_available} / {item.quantity_total} {item.unit}
                      </td>
                      <td className="px-4 py-3">
                        <CueLight tone={meta.tone} label={meta.label} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => adjust(item, -1, 'sold')}
                            className="inline-flex items-center gap-1 text-xs text-cuesheet/50 hover:text-cuesheet"
                          >
                            <Minus size={13} /> Use
                          </button>
                          <button
                            onClick={() => adjust(item, 1, 'restock')}
                            className="inline-flex items-center gap-1 text-xs text-wash hover:text-cuesheet"
                          >
                            <PlusCircle size={13} /> Restock
                          </button>
                        </div>
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
        <NewEquipmentModal
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

function NewEquipmentModal({
  organizationId,
  onClose,
  onCreated,
}: {
  organizationId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('units')
  const [quantityTotal, setQuantityTotal] = useState('0')
  const [lowStockThreshold, setLowStockThreshold] = useState('5')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const total = Number(quantityTotal) || 0
    const { error } = await supabase.from('equipment').insert({
      organization_id: organizationId,
      name,
      category: category || null,
      unit,
      quantity_total: total,
      quantity_available: total,
      low_stock_threshold: Number(lowStockThreshold) || 0,
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    onCreated()
  }

  return (
    <Modal title="Add equipment" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Item name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Heineken kegs, Wireless mics"
          />
        </Field>
        <Field label="Category">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
            placeholder="e.g. Bar, AV, Safety"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Unit">
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={inputClass}
              placeholder="kegs, units, cases"
            />
          </Field>
          <Field label="Total on hand">
            <input
              type="number"
              min={0}
              value={quantityTotal}
              onChange={(e) => setQuantityTotal(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Low-stock alert threshold">
          <input
            type="number"
            min={0}
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value)}
            className={inputClass}
          />
        </Field>
        {error && <p className="mb-3 text-sm text-standby">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Adding…' : 'Add item'}
        </Button>
      </form>
    </Modal>
  )
}
