import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Contact } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    if (!organization) return
    setLoading(true)
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
    setCustomers((data as Customer[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization])

  return (
    <div>
      <TopBar title="Customers" />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-cuesheet/45">
            {customers.length} customer{customers.length === 1 ? '' : 's'} in your CRM
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={15} /> Add customer
          </Button>
        </div>

        {!loading && customers.length === 0 ? (
          <EmptyState
            icon={<Contact size={28} />}
            title="No customers yet"
            body="Your 2,000+ leads land here once imported — every purchase and event they attend builds their history automatically."
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
                  <th className="px-4 py-3 font-normal">Phone</th>
                  <th className="px-4 py-3 font-normal">Source</th>
                  <th className="px-4 py-3 font-normal">Added</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t border-graphite-line/70">
                    <td className="px-4 py-3 text-cuesheet">{c.full_name || '—'}</td>
                    <td className="px-4 py-3 text-cuesheet/60">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-cuesheet/60">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-cuesheet/45">{c.source || '—'}</td>
                    <td className="px-4 py-3 text-cuesheet/45">
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
          onCreated={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function NewCustomerModal({
  organizationId,
  onClose,
  onCreated,
}: {
  organizationId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [source, setSource] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.from('customers').insert({
      organization_id: organizationId,
      full_name: fullName || null,
      email: email || null,
      phone: phone || null,
      source: source || null,
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    onCreated()
  }

  return (
    <Modal title="Add customer" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Full name">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            placeholder="Customer name"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="name@email.com"
          />
        </Field>
        <Field label="Phone">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="+27…"
          />
        </Field>
        <Field label="Source">
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className={inputClass}
            placeholder="e.g. lead import, walk-up, referral"
          />
        </Field>
        {error && <p className="mb-3 text-sm text-standby">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Adding…' : 'Add customer'}
        </Button>
      </form>
    </Modal>
  )
}
