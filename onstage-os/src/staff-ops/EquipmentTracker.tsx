import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Package, Minus, PlusCircle, Wrench, FlaskConical, Wifi, WifiOff } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { TopBar } from '../core/layout/TopBar'
import { Button } from '../core/components/Button'
import { EmptyState } from '../core/components/EmptyState'
import { CueLight } from '../core/components/CueLight'
import { Modal, Field, inputClass } from '../core/components/Modal'
import { stockMeta } from '../core/statusMeta'
import { clsx } from '../core/utils'
import type { Equipment } from '../core/types'

type Tab = 'consumables' | 'gear'

const CONDITION_COLOR: Record<string, string> = {
  excellent: 'text-wash', good: 'text-cuesheet/70',
  fair: 'text-amber', poor: 'text-standby',
}

export function EquipmentTracker() {
  const { organization } = useAuth()
  const [tab,      setTab]      = useState<Tab>('consumables')
  const [items,    setItems]    = useState<Equipment[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [posStatus, setPosStatus] = useState<'connected'|'disconnected'|'unknown'>('unknown')

  async function load() {
    if (!organization) return
    setLoading(true)
    const { data } = await supabase
      .from('equipment').select('*')
      .eq('organization_id', organization.id)
      .eq('equipment_type', tab)
      .order('name')
    setItems((data as Equipment[]) || [])
    setLoading(false)
  }

  async function checkPosStatus() {
    if (!organization) return
    const { data } = await supabase
      .from('pos_integrations').select('is_active, last_sync_at')
      .eq('organisation_id', organization.id).maybeSingle()
    if (!data) setPosStatus('disconnected')
    else setPosStatus(data.is_active ? 'connected' : 'disconnected')
  }

  useEffect(() => { load(); if (tab === 'consumables') checkPosStatus() }, [organization, tab]) // eslint-disable-line

  async function adjust(item: Equipment, delta: number, changeType: string) {
    const nextQty = Math.max(0, item.quantity_available + delta)
    await supabase.from('equipment').update({ quantity_available: nextQty }).eq('id', item.id)
    await supabase.from('equipment_logs').insert({ equipment_id: item.id, change_type: changeType, quantity: Math.abs(delta) })
    load()
  }

  const tabBtn = (t: Tab, label: string, Icon: React.ElementType) => (
    <button onClick={() => setTab(t)}
      className={clsx('flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
        tab === t ? 'bg-amber/10 text-amber-bright' : 'text-cuesheet/50 hover:text-cuesheet')}>
      <Icon size={16} />{label}
    </button>
  )

  return (
    <div>
      <TopBar title="Production Assets" />
      <div className="p-4 lg:p-6">
        {/* Tab switcher */}
        <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 rounded-lg border border-graphite-line bg-riser p-1">
            {tabBtn('consumables', 'Bar & Consumables', FlaskConical)}
            {tabBtn('gear', 'Gear & Hardware', Wrench)}
          </div>
          <div className="flex items-center gap-2">
            {tab === 'consumables' && (
              <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider',
                posStatus === 'connected'
                  ? 'border-wash/30 text-wash' : 'border-graphite-line text-cuesheet/30')}>
                {posStatus === 'connected' ? <Wifi size={11} /> : <WifiOff size={11} />}
                {posStatus === 'connected' ? 'Lightspeed syncing' : 'ePOS not connected'}
              </span>
            )}
            <Button onClick={() => setShowForm(true)}>
              <Plus size={15} /> Add {tab === 'consumables' ? 'item' : 'equipment'}
            </Button>
          </div>
        </div>

        {!loading && items.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title={tab === 'consumables' ? 'No consumables tracked yet' : 'No gear logged yet'}
            body={tab === 'consumables'
              ? 'Track beer, spirits, ice, and any stock that gets used up. Connect Lightspeed K Series to sync sales automatically.'
              : 'Log speakers, mics, lights, staging — any gear that leaves the warehouse and needs to come back.'}
            action={<Button onClick={() => setShowForm(true)} variant="secondary"><Plus size={15} /> Add {tab === 'consumables' ? 'item' : 'equipment'}</Button>}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-graphite-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-riser text-xs uppercase tracking-wide text-cuesheet/40">
                <tr>
                  <th className="px-4 py-3 font-normal">Name</th>
                  <th className="px-4 py-3 font-normal hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 font-normal">Stock</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  {tab === 'gear' && <th className="px-4 py-3 font-normal hidden lg:table-cell">Condition</th>}
                  {tab === 'consumables' && <th className="px-4 py-3 font-normal hidden lg:table-cell">SKU</th>}
                  <th className="px-4 py-3 font-normal">
                    {tab === 'consumables' ? 'Adjust' : 'Assign'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const meta = stockMeta(item.quantity_available, item.low_stock_threshold)
                  return (
                    <tr key={item.id} className="border-t border-graphite-line/70">
                      <td className="px-4 py-3 text-cuesheet font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-cuesheet/55 hidden md:table-cell">{item.category || '—'}</td>
                      <td className="px-4 py-3 font-mono text-cuesheet/70">
                        {item.quantity_available}<span className="text-cuesheet/30">/{item.quantity_total}</span>
                        <span className="ml-1 text-cuesheet/30 text-xs">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3"><CueLight tone={meta.tone} label={meta.label} /></td>
                      {tab === 'gear' && (
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={clsx('text-xs capitalize', CONDITION_COLOR[(item as Equipment & {condition?: string}).condition || 'good'])}>
                            {(item as Equipment & {condition?: string}).condition || 'good'}
                          </span>
                        </td>
                      )}
                      {tab === 'consumables' && (
                        <td className="px-4 py-3 font-mono text-xs text-cuesheet/35 hidden lg:table-cell">
                          {(item as Equipment & {pos_sku?: string}).pos_sku || '—'}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        {tab === 'consumables' ? (
                          <div className="flex items-center gap-3">
                            <button onClick={() => adjust(item, -1, 'sold')}
                              className="inline-flex items-center gap-1 text-xs text-cuesheet/50 hover:text-cuesheet">
                              <Minus size={13} /> Use
                            </button>
                            <button onClick={() => adjust(item, 1, 'restock')}
                              className="inline-flex items-center gap-1 text-xs text-wash hover:text-cuesheet">
                              <PlusCircle size={13} /> Restock
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-cuesheet/35">
                            {item.quantity_available > 0 ? 'Available' : 'All out'}
                          </span>
                        )}
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
          type={tab}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}

function NewEquipmentModal({ organizationId, type, onClose, onCreated }:
  { organizationId: string; type: Tab; onClose: () => void; onCreated: () => void }) {
  const [name,      setName]      = useState('')
  const [category,  setCategory]  = useState('')
  const [unit,      setUnit]      = useState(type === 'consumables' ? 'units' : 'items')
  const [qty,       setQty]       = useState('0')
  const [threshold, setThreshold] = useState('5')
  const [serial,    setSerial]    = useState('')
  const [condition, setCondition] = useState('good')
  const [posSkU,    setPosSku]    = useState('')
  const [supplier,  setSupplier]  = useState('')
  const [error,     setError]     = useState<string | null>(null)
  const [busy,      setBusy]      = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    const total = Number(qty) || 0
    const { error } = await supabase.from('equipment').insert({
      organization_id: organizationId, name, category: category || null,
      unit, quantity_total: total, quantity_available: total,
      low_stock_threshold: Number(threshold) || 0,
      equipment_type: type,
      serial_number: serial || null,
      condition: type === 'gear' ? condition : null,
      pos_sku: type === 'consumables' ? (posSkU || null) : null,
      supplier: supplier || null,
    })
    setBusy(false)
    if (error) { setError(error.message); return }
    onCreated()
  }

  return (
    <Modal title={type === 'consumables' ? 'Add consumable item' : 'Add gear / hardware'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Name">
          <input required value={name} onChange={e => setName(e.target.value)} className={inputClass}
            placeholder={type === 'consumables' ? 'e.g. Heineken 330ml, Jack Daniels 750ml' : 'e.g. QSC K12.2 Speaker'} />
        </Field>
        <Field label="Category">
          <input value={category} onChange={e => setCategory(e.target.value)} className={inputClass}
            placeholder={type === 'consumables' ? 'Beer, Spirits, Soft Drinks, Ice' : 'Audio, Lighting, Staging, Safety'} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Unit">
            <input value={unit} onChange={e => setUnit(e.target.value)} className={inputClass}
              placeholder={type === 'consumables' ? 'cases, bottles, kg' : 'units'} />
          </Field>
          <Field label="Qty on hand">
            <input type="number" min={0} value={qty} onChange={e => setQty(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label={type === 'consumables' ? 'Low stock alert threshold' : 'Minimum units (before alert)'}>
          <input type="number" min={0} value={threshold} onChange={e => setThreshold(e.target.value)} className={inputClass} />
        </Field>
        {type === 'gear' && (
          <>
            <Field label="Serial / Asset number">
              <input value={serial} onChange={e => setSerial(e.target.value)} className={inputClass} placeholder="Optional" />
            </Field>
            <Field label="Condition">
              <select value={condition} onChange={e => setCondition(e.target.value)} className={inputClass}>
                {['excellent','good','fair','poor'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </Field>
          </>
        )}
        {type === 'consumables' && (
          <Field label="Lightspeed SKU (for auto-sync)">
            <input value={posSkU} onChange={e => setPosSku(e.target.value)} className={inputClass} placeholder="Optional — enables ePOS sync" />
          </Field>
        )}
        <Field label="Supplier">
          <input value={supplier} onChange={e => setSupplier(e.target.value)} className={inputClass} placeholder="Optional" />
        </Field>
        {error && <p className="mb-3 text-sm text-standby">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Adding…' : `Add ${type === 'consumables' ? 'item' : 'equipment'}`}
        </Button>
      </form>
    </Modal>
  )
}
