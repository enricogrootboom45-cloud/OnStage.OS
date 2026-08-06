import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Contact } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { TopBar } from '../core/layout/TopBar'
import { Button } from '../core/components/Button'
import { EmptyState } from '../core/components/EmptyState'
import { Modal, Field, inputClass } from '../core/components/Modal'
import { formatDateTime } from '../core/utils'
import type { Customer } from '../core/types'

export function CustomersList() {
  const { organization } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
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
    setCustomers((data as Customer[]) || [])
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
              {customers.length} customer{customers.length === 1 ? '' : 's'}
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
            <Plus size={15} /> Add customer
          </Button>
        </div>

        {!loading && customers.length === 0 ? (
          <EmptyState
            icon={<Contact size={28} />}
            title="No customers yet"
            body="Your 2,000+ leads land here once imported — every purchase builds their history automatically."
            action={
              <Button onClick={() => setShowForm(true)} variant="secondary">
                <Plus size={15} /> Add customer
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-graphite-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-riser text-xs uppercase tracking-wide text-cuesheet/40">
                <tr>
                  <th className="px-4 py-3 font-normal">Name</th>
                  <th className="px-4 py-3 font-normal">Email</th>
                  <th className="px-4 py-3 font-normal hidden md:table-cell">Phone</th>
                  <th className="px-4 py-3 font-normal hidden lg:table-cell">Source</th>
                  <th className="px-4 py-3 font-normal hidden lg:table-cell">Added</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}
                    className="border-t border-graphite-line/70 transition-colors hover:bg-riser/60">
                    <td className="px-4 py-3">
                      <Link
                        to={`/customers/${c.id}`}
                        className="font-medium text-cuesheet hover:text-amber-bright"
                      >
                        {c.full_name || '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-cuesheet/60">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-cuesheet/60 hidden md:table-cell">
                      {c.phone || '—'}
                    </td>
                    <td className="px-4 py-3 text-cuesheet/45 hidden lg:table-cell">
                      {c.source || '—'}
                    </td>
                    <td className="px-4 py-3 text-cuesheet/45 hidden lg:table-cell">
                      {formatDateTime(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    <Modal title="Add customer" onClose={onClose}>
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
          {busy ? 'Adding…' : 'Add customer'}
        </Button>
      </form>
    </Modal>
  )
}
