import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Contact } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { TopBar } from '../core/layout/TopBar'
import { Button } from '../core/components/Button'
import { EmptyState } from '../core/components/EmptyState'
import { Avatar } from '../core/components/Avatar'
import { Modal, Field, inputClass } from '../core/components/Modal'
import { formatMoney } from '../core/utils'
import type { Customer } from '../core/types'

interface CustomerWithStats extends Customer {
  ticketCount: number
  totalSpend: number
}

export function CustomersList() {
  const { organization } = useAuth()
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [search,    setSearch]    = useState('')

  async function load() {
    if (!organization) return
    setLoading(true)
    const { data } = await supabase
      .from('customers').select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
    const base = (data as Customer[]) || []

    // One aggregate pass so the list shows "we know this person" —
    // ticket count + spend — instead of just raw contact details.
    let ticketData: { customer_id: string | null; amount_paid: number | null }[] = []
    if (base.length > 0) {
      const res = await supabase
        .from('tickets')
        .select('customer_id, amount_paid')
        .in('customer_id', base.map((c) => c.id))
        .in('status', ['valid', 'checked_in'])
      ticketData = res.data || []
    }

    const stats = new Map<string, { count: number; spend: number }>()
    for (const t of ticketData) {
      if (!t.customer_id) continue
      const s = stats.get(t.customer_id) || { count: 0, spend: 0 }
      s.count += 1
      s.spend += Number(t.amount_paid) || 0
      stats.set(t.customer_id, s)
    }

    setCustomers(base.map((c) => ({
      ...c,
      ticketCount: stats.get(c.id)?.count || 0,
      totalSpend: stats.get(c.id)?.spend || 0,
    })))
    setLoading(false)
  }

  useEffect(() => { load() }, [organization]) // eslint-disable-line

  const filtered = customers.filter(c =>
    !search ||
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  return (
    <div>
      <TopBar title="Audience" />
      <div className="p-4 lg:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-cuesheet/45">
              {customers.length} in your audience
            </p>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="rounded-md border border-graphite-line bg-blackout px-3 py-1.5 text-sm
                         text-cuesheet placeholder:text-cuesheet/30 focus:border-amber/60 w-40"
            />
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={15} /> Add to audience
          </Button>
        </div>

        {!loading && customers.length === 0 ? (
          <EmptyState
            icon={<Contact size={28} />}
            title="No one in your audience yet"
            body="Every ticket buyer lands here automatically — their purchase history builds itself as they come back."
            action={
              <Button onClick={() => setShowForm(true)} variant="secondary">
                <Plus size={15} /> Add to audience
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-graphite-line/70 rounded-lg border border-graphite-line bg-riser">
            {filtered.map((c) => (
              <Link
                key={c.id}
                to={`/customers/${c.id}`}
                className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-blackout/30"
              >
                <Avatar name={c.full_name || c.email || '?'} size="sm" />
                <div className="min-w-[160px] flex-1">
                  <p className="text-sm text-cuesheet">{c.full_name || c.email || 'Unnamed'}</p>
                  <p className="text-xs text-cuesheet/40">{c.email || c.phone || 'No contact info'}</p>
                </div>
                <div className="w-32 shrink-0 text-right">
                  {c.ticketCount > 0 ? (
                    <>
                      <p className="text-sm text-amber">{formatMoney(c.totalSpend)}</p>
                      <p className="text-xs text-cuesheet/35">
                        {c.ticketCount} ticket{c.ticketCount === 1 ? '' : 's'}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-cuesheet/25">No purchases yet</p>
                  )}
                </div>
                {c.source && (
                  <span className="hidden shrink-0 rounded-full border border-graphite-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cuesheet/35 lg:inline-block">
                    {c.source}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <NewCustomerModal
          organizationId={organization!.id}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}

function NewCustomerModal({ organizationId, onClose, onCreated }:
  { organizationId: string; onClose: () => void; onCreated: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [source,   setSource]   = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [busy,     setBusy]     = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    const { error } = await supabase.from('customers').insert({
      organization_id: organizationId,
      full_name: fullName || null, email: email || null,
      phone: phone || null, source: source || null,
    })
    setBusy(false)
    if (error) { setError(error.message); return }
    onCreated()
  }

  return (
    <Modal title="Add to audience" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Full name">
          <input value={fullName} onChange={e => setFullName(e.target.value)}
            className={inputClass} placeholder="Customer name" />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className={inputClass} placeholder="name@email.com" />
        </Field>
        <Field label="Phone">
          <input value={phone} onChange={e => setPhone(e.target.value)}
            className={inputClass} placeholder="+27…" />
        </Field>
        <Field label="Source">
          <input value={source} onChange={e => setSource(e.target.value)}
            className={inputClass} placeholder="e.g. lead import, walk-up, referral" />
        </Field>
        {error && <p className="mb-3 text-sm text-standby">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Adding…' : 'Add to audience'}
        </Button>
      </form>
    </Modal>
  )
}