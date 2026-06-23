import { useState, type FormEvent } from 'react'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { Button } from '../core/components/Button'
import { inputClass } from '../core/components/Modal'

export function OnboardingOrg() {
  const { session, refreshProfile } = useAuth()
  const [orgName, setOrgName] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!session?.user) return
    setSubmitting(true)
    setError(null)
    try {
      const { error: rpcError } = await supabase.rpc('create_organization', {
        org_name: orgName,
        owner_full_name: fullName,
      })
      if (rpcError) throw rpcError
      await refreshProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set up your organization')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-xl font-semibold text-cuesheet">Set the stage</p>
          <p className="mt-1 text-sm text-cuesheet/45">
            One organization to hold every event, venue, crew member, and customer.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-graphite-line bg-riser p-6 shadow-desk"
        >
          <label className="mb-3 block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-cuesheet/40">
              Company / crew name
            </span>
            <input
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Tableview Live Events"
            />
          </label>
          <label className="mb-4 block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-cuesheet/40">
              Your name
            </span>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              placeholder="Your full name"
            />
          </label>
          {error && <p className="mb-4 text-sm text-standby">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Setting up…' : 'Enter the console'}
          </Button>
        </form>
      </div>
    </div>
  )
}
