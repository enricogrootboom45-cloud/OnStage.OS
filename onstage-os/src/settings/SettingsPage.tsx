import { useEffect, useState, type FormEvent } from 'react'
import { Settings, Users, Mail, CheckCircle } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { TopBar } from '../core/layout/TopBar'
import { Button } from '../core/components/Button'
import { Field, inputClass } from '../core/components/Modal'
import { useRole } from '../core/hooks/useRole'
import type { Profile, Invite, Role } from '../core/types'

const ROLES: Role[] = ['owner', 'admin', 'manager', 'staff']

export function SettingsPage() {
  const { organization, profile, refreshProfile } = useAuth()
  const { isAdmin } = useRole()
  const [members,     setMembers]     = useState<Profile[]>([])
  const [invites,     setInvites]     = useState<Invite[]>([])
  const [orgName,     setOrgName]     = useState('')
  const [savingOrg,   setSavingOrg]   = useState(false)
  const [orgSaved,    setOrgSaved]    = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole,  setInviteRole]  = useState<Role>('staff')
  const [inviting,    setInviting]    = useState(false)
  const [inviteSent,  setInviteSent]  = useState(false)

  async function load() {
    if (!organization) return
    setOrgName(organization.name)
    const [membersRes, invitesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('organization_id', organization.id),
      supabase.from('invites').select('*').eq('organization_id', organization.id).eq('accepted', false),
    ])
    setMembers((membersRes.data as Profile[]) || [])
    setInvites((invitesRes.data as Invite[]) || [])
  }

  useEffect(() => { load() }, [organization]) // eslint-disable-line

  async function saveOrgName(e: FormEvent) {
    e.preventDefault()
    if (!organization) return
    setSavingOrg(true)
    await supabase.from('organizations').update({ name: orgName }).eq('id', organization.id)
    await refreshProfile()
    setSavingOrg(false)
    setOrgSaved(true)
    setTimeout(() => setOrgSaved(false), 2500)
  }

  async function updateRole(memberId: string, role: Role) {
    await supabase.from('profiles').update({ role }).eq('id', memberId)
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role } : m))
  }

  async function sendInvite(e: FormEvent) {
    e.preventDefault()
    if (!organization) return
    setInviting(true)
    const { error } = await supabase.from('invites').upsert({
      organization_id: organization.id,
      email: inviteEmail.toLowerCase().trim(),
      role: inviteRole,
      invited_by: profile?.id ?? null,
    }, { onConflict: 'organization_id,email' })
    setInviting(false)
    if (!error) {
      setInviteSent(true)
      setInviteEmail('')
      setTimeout(() => setInviteSent(false), 3000)
      load()
    }
  }

  async function revokeInvite(id: string) {
    await supabase.from('invites').delete().eq('id', id)
    setInvites((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div>
      <TopBar title="Settings" />
      <div className="mx-auto max-w-2xl p-4 lg:p-6">

        {/* Organisation */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Settings size={16} className="text-cuesheet/40" />
            <p className="font-display text-sm font-semibold text-cuesheet">Organisation</p>
          </div>
          <div className="rounded-lg border border-graphite-line bg-riser p-5">
            <form onSubmit={saveOrgName}>
              <Field label="Organisation name">
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={savingOrg}>
                  {savingOrg ? 'Saving…' : 'Save'}
                </Button>
                {orgSaved && (
                  <span className="flex items-center gap-1 text-xs text-wash">
                    <CheckCircle size={13} /> Saved
                  </span>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* Team members */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Users size={16} className="text-cuesheet/40" />
            <p className="font-display text-sm font-semibold text-cuesheet">
              Team ({members.length})
            </p>
          </div>
          <div className="overflow-hidden rounded-lg border border-graphite-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-riser text-xs uppercase tracking-wide text-cuesheet/40">
                <tr>
                  <th className="px-4 py-3 font-normal">Member</th>
                  <th className="px-4 py-3 font-normal">Role</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-t border-graphite-line/70">
                    <td className="px-4 py-3">
                      <p className="text-cuesheet">{m.full_name || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && m.id !== profile?.id ? (
                        <select
                          value={m.role}
                          onChange={(e) => updateRole(m.id, e.target.value as Role)}
                          className="rounded border border-graphite-line bg-blackout px-2 py-1 text-xs text-cuesheet"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-mono text-xs text-cuesheet/55">{m.role}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Invite */}
        {isAdmin && (
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <Mail size={16} className="text-cuesheet/40" />
              <p className="font-display text-sm font-semibold text-cuesheet">Invite team member</p>
            </div>
            <div className="rounded-lg border border-graphite-line bg-riser p-5">
              <form onSubmit={sendInvite}>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Field label="Email">
                      <input
                        required
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className={inputClass}
                        placeholder="teammate@email.com"
                      />
                    </Field>
                  </div>
                  <div className="w-32">
                    <Field label="Role">
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as Role)}
                        className={inputClass}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={inviting}>
                    {inviting ? 'Inviting…' : 'Send invite'}
                  </Button>
                  {inviteSent && (
                    <span className="flex items-center gap-1 text-xs text-wash">
                      <CheckCircle size={13} /> Invite saved — share the sign-up link with them
                    </span>
                  )}
                </div>
              </form>

              {/* Pending invites */}
              {invites.length > 0 && (
                <div className="mt-4 border-t border-graphite-line pt-4">
                  <p className="mb-2 text-xs text-cuesheet/40">Pending invites</p>
                  <div className="space-y-2">
                    {invites.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-cuesheet/70">{inv.email}</span>
                          <span className="ml-2 font-mono text-xs text-cuesheet/35">{inv.role}</span>
                        </div>
                        <button
                          onClick={() => revokeInvite(inv.id)}
                          className="text-xs text-cuesheet/30 hover:text-standby"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-md border border-graphite-line/50 bg-blackout p-3">
                <p className="text-xs leading-relaxed text-cuesheet/40">
                  After adding an invite, share your sign-up link:{' '}
                  <span className="font-mono text-cuesheet/60">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://on-stage-os.vercel.app'}
                  </span>
                  . When they sign up with the invited email, they'll join your org automatically.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Integrations status */}
        <section>
          <p className="mb-3 font-display text-sm font-semibold text-cuesheet">Integrations</p>
          <div className="space-y-3">
            {[
              {
                name: 'Stripe (payments)',
                key: 'VITE_STRIPE_PUBLISHABLE_KEY',
                configured: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
                instructions: 'Add VITE_STRIPE_PUBLISHABLE_KEY to Vercel env vars + STRIPE_SECRET_KEY to Supabase Edge Function secrets',
              },
            ].map((integration) => (
              <div key={integration.name} className="rounded-lg border border-graphite-line bg-riser p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-cuesheet">{integration.name}</p>
                  <span className={[
                    'rounded-full px-2 py-0.5 font-mono text-[10px] uppercase',
                    integration.configured
                      ? 'bg-wash/20 text-wash'
                      : 'bg-standby/20 text-standby',
                  ].join(' ')}>
                    {integration.configured ? 'Connected' : 'Not configured'}
                  </span>
                </div>
                {!integration.configured && (
                  <p className="mt-1.5 text-xs text-cuesheet/35">{integration.instructions}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
