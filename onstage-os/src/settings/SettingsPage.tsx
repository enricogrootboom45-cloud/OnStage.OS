import { useEffect, useState, useRef, type ChangeEvent, type FormEvent } from 'react'
import { Settings, Users, Mail, Copy, Check, Palette, Image, Globe, Instagram, Loader2 } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { TopBar } from '../core/layout/TopBar'
import { Button } from '../core/components/Button'
import { Modal, Field, inputClass } from '../core/components/Modal'
import { clsx } from '../core/utils'
import type { Invite, Role } from '../core/types'

// ─── Supabase Storage upload ───────────────────────────────
async function uploadOrgAsset(file: File, orgId: string, type: 'logo' | 'banner'): Promise<string> {
  const ext  = file.name.split('.').pop() || 'jpg'
  const path = `orgs/${orgId}/${type}.${ext}`
  const { data, error } = await supabase.storage.from('org-assets')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data: urlData } = supabase.storage.from('org-assets').getPublicUrl(data.path)
  return urlData.publicUrl
}

// ─── Theme presets ─────────────────────────────────────────
const THEMES = [
  { id: 'default',    label: 'Stage',       primary: '#E8893A', secondary: '#5C7C93' },
  { id: 'midnight',   label: 'Midnight',    primary: '#7B6EF6', secondary: '#4A90D9' },
  { id: 'neon',       label: 'Neon',        primary: '#39FF14', secondary: '#FF073A' },
  { id: 'gold',       label: 'Gold',        primary: '#FFD700', secondary: '#B8860B' },
  { id: 'ocean',      label: 'Ocean',       primary: '#00CED1', secondary: '#20B2AA' },
  { id: 'rose',       label: 'Rose',        primary: '#FF69B4', secondary: '#C71585' },
  { id: 'custom',     label: 'Custom',      primary: '',        secondary: '' },
]

const ROLES: Role[] = ['staff', 'manager', 'admin', 'owner']

export function SettingsPage() {
  const { organization, profile, refreshProfile } = useAuth()

  // Org fields
  const [orgName,     setOrgName]     = useState('')
  const [tagline,     setTagline]     = useState('')
  const [description, setDescription] = useState('')
  const [website,     setWebsite]     = useState('')
  const [instagram,   setInstagram]   = useState('')
  const [primaryColor,setPrimary]     = useState('#E8893A')
  const [secondaryColor,setSecondary] = useState('#5C7C93')
  const [theme,       setTheme]       = useState('default')
  const [logoUrl,     setLogoUrl]     = useState<string | null>(null)
  const [bannerUrl,   setBannerUrl]   = useState<string | null>(null)

  // Invites
  const [invites,     setInvites]     = useState<Invite[]>([])
  const [showInvite,  setShowInvite]  = useState(false)

  // UI state
  const [saveBusy,    setSaveBusy]    = useState(false)
  const [logoBusy,    setLogoBusy]    = useState(false)
  const [bannerBusy,  setBannerBusy]  = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [activeSection, setActiveSection] = useState<'org' | 'brand' | 'team'>('org')

  const logoRef   = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!organization) return
    setOrgName(organization.name || '')
    setTagline((organization as any).tagline || '')
    setDescription((organization as any).description || '')
    setWebsite((organization as any).website || '')
    setInstagram((organization as any).instagram_handle || '')
    setPrimary((organization as any).primary_color || '#E8893A')
    setSecondary((organization as any).secondary_color || '#5C7C93')
    setTheme((organization as any).theme || 'default')
    setLogoUrl((organization as any).logo_url || null)
    setBannerUrl((organization as any).banner_url || null)
    loadInvites()
  }, [organization]) // eslint-disable-line

  async function loadInvites() {
    if (!organization) return
    const { data } = await supabase.from('invites').select('*')
      .eq('organization_id', organization.id).order('created_at', { ascending: false })
    setInvites((data as Invite[]) || [])
  }

  async function handleThemeSelect(t: typeof THEMES[number]) {
    setTheme(t.id)
    if (t.id !== 'custom') { setPrimary(t.primary); setSecondary(t.secondary) }
  }

  async function saveOrg(e: FormEvent) {
    e.preventDefault()
    if (!organization) return
    setSaveBusy(true)
    await supabase.from('organizations').update({
      name: orgName, tagline, description, website,
      instagram_handle: instagram,
      primary_color:    primaryColor,
      secondary_color:  secondaryColor,
      theme,
    }).eq('id', organization.id)
    await refreshProfile()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    setSaveBusy(false)
  }

  async function handleLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !organization) return
    setLogoBusy(true)
    try {
      const url = await uploadOrgAsset(file, organization.id, 'logo')
      await supabase.from('organizations').update({ logo_url: url }).eq('id', organization.id)
      setLogoUrl(url)
      await refreshProfile()
    } catch (err) { console.error(err) }
    setLogoBusy(false)
    if (logoRef.current) logoRef.current.value = ''
  }

  async function handleBannerUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !organization) return
    setBannerBusy(true)
    try {
      const url = await uploadOrgAsset(file, organization.id, 'banner')
      await supabase.from('organizations').update({ banner_url: url }).eq('id', organization.id)
      setBannerUrl(url)
      await refreshProfile()
    } catch (err) { console.error(err) }
    setBannerBusy(false)
    if (bannerRef.current) bannerRef.current.value = ''
  }

  const sections = [
    { id: 'org',   label: 'Organisation', icon: Settings },
    { id: 'brand', label: 'Brand',        icon: Palette  },
    { id: 'team',  label: 'Team',         icon: Users    },
  ] as const

  return (
    <div>
      <TopBar title="Settings" />
      <div className="p-4 lg:p-6">
        {/* Section tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-graphite-line bg-riser p-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveSection(id as typeof activeSection)}
              className={clsx('flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors',
                activeSection === id
                  ? 'bg-blackout text-amber-bright'
                  : 'text-cuesheet/50 hover:text-cuesheet')}>
              <Icon size={15} /><span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Organisation ── */}
        {activeSection === 'org' && (
          <form onSubmit={saveOrg} className="max-w-lg space-y-4">
            <Field label="Organisation name">
              <input required value={orgName} onChange={e => setOrgName(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Tagline">
              <input value={tagline} onChange={e => setTagline(e.target.value)} className={inputClass}
                placeholder="Short line that appears on your public page" />
            </Field>
            <Field label="Description">
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={3} className={inputClass + ' resize-none'}
                placeholder="Tell customers about your events" />
            </Field>
            <Field label="Website">
              <input value={website} onChange={e => setWebsite(e.target.value)} className={inputClass}
                placeholder="https://yoursite.com" type="url" />
            </Field>
            <Field label="Instagram handle">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cuesheet/30">@</span>
                <input value={instagram} onChange={e => setInstagram(e.target.value)}
                  className={inputClass + ' pl-7'} placeholder="yourhandle" />
              </div>
            </Field>
            <Button type="submit" disabled={saveBusy} className="w-full sm:w-auto">
              {saveBusy ? <><Loader2 size={15} className="animate-spin" /> Saving…</> :
               saved    ? <><Check size={15} /> Saved!</> : 'Save changes'}
            </Button>
          </form>
        )}

        {/* ── Brand ── */}
        {activeSection === 'brand' && (
          <div className="max-w-lg space-y-6">
            {/* Logo */}
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-cuesheet/40">Logo</p>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-xl border border-dashed border-graphite-line overflow-hidden bg-blackout flex items-center justify-center">
                  {logoUrl
                    ? <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    : <Image size={22} className="text-cuesheet/25" />}
                </div>
                <div>
                  <Button variant="secondary" size="sm" onClick={() => logoRef.current?.click()} disabled={logoBusy}>
                    {logoBusy ? <><Loader2 size={13} className="animate-spin" /> Uploading…</> : 'Upload logo'}
                  </Button>
                  <p className="mt-1 text-xs text-cuesheet/30">PNG or JPG · appears on tickets and public page</p>
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
            </div>

            {/* Banner */}
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-cuesheet/40">Banner / cover image</p>
              <div className="aspect-[3/1] rounded-xl border border-dashed border-graphite-line overflow-hidden bg-blackout flex items-center justify-center cursor-pointer hover:border-cuesheet/30 transition-colors"
                onClick={() => bannerRef.current?.click()}>
                {bannerUrl
                  ? <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
                  : <div className="flex flex-col items-center gap-2 text-cuesheet/25">
                      <Image size={28} />
                      <p className="text-xs">Click to upload banner (16:9 recommended)</p>
                    </div>}
              </div>
              {bannerBusy && <p className="mt-1 text-xs text-cuesheet/40 flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Uploading…</p>}
              <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
            </div>

            {/* Theme selector */}
            <div>
              <p className="mb-3 text-xs uppercase tracking-wider text-cuesheet/40">Theme</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => handleThemeSelect(t)}
                    className={clsx('rounded-xl border p-3 text-center transition-all',
                      theme === t.id ? 'border-amber bg-amber/10' : 'border-graphite-line hover:border-cuesheet/30')}>
                    {t.id !== 'custom' && (
                      <div className="mx-auto mb-2 flex h-6 w-full rounded-full overflow-hidden">
                        <div className="flex-1" style={{ background: t.primary }} />
                        <div className="flex-1" style={{ background: t.secondary }} />
                      </div>
                    )}
                    {t.id === 'custom' && (
                      <div className="mx-auto mb-2 flex h-6 w-full rounded-full overflow-hidden">
                        <div className="flex-1" style={{ background: primaryColor }} />
                        <div className="flex-1" style={{ background: secondaryColor }} />
                      </div>
                    )}
                    <p className="font-mono text-[10px] uppercase tracking-wider text-cuesheet/60">{t.label}</p>
                  </button>
                ))}
              </div>

              {/* Custom colour pickers */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-xs text-cuesheet/40">Primary colour</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={primaryColor} onChange={e => { setPrimary(e.target.value); setTheme('custom') }}
                      className="h-9 w-9 cursor-pointer rounded-lg border border-graphite-line bg-transparent p-0.5" />
                    <input value={primaryColor} onChange={e => { setPrimary(e.target.value); setTheme('custom') }}
                      className={inputClass + ' flex-1 font-mono text-sm'} placeholder="#E8893A" />
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs text-cuesheet/40">Secondary colour</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={secondaryColor} onChange={e => { setSecondary(e.target.value); setTheme('custom') }}
                      className="h-9 w-9 cursor-pointer rounded-lg border border-graphite-line bg-transparent p-0.5" />
                    <input value={secondaryColor} onChange={e => { setSecondary(e.target.value); setTheme('custom') }}
                      className={inputClass + ' flex-1 font-mono text-sm'} placeholder="#5C7C93" />
                  </div>
                </div>
              </div>

              <Button className="mt-4 w-full sm:w-auto" onClick={saveOrg} disabled={saveBusy}>
                {saveBusy ? <><Loader2 size={15} className="animate-spin" /> Saving…</> :
                 saved    ? <><Check size={15} /> Saved!</> : 'Save brand settings'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Team ── */}
        {activeSection === 'team' && (
          <div className="max-w-lg">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-cuesheet/50">
                {invites.length} pending invite{invites.length !== 1 ? 's' : ''}
              </p>
              <Button onClick={() => setShowInvite(true)}>
                <Mail size={15} /> Invite member
              </Button>
            </div>

            {/* Pending invites */}
            {invites.filter(i => !i.accepted).length > 0 && (
              <div className="mb-6 space-y-2">
                <p className="text-xs uppercase tracking-wider text-cuesheet/30 mb-2">Pending invites</p>
                {invites.filter(i => !i.accepted).map(invite => {
                  const link = `${window.location.origin}/join?invite=${invite.id}`
                  return (
                    <InviteRow key={invite.id} invite={invite} link={link}
                      onRevoke={async () => {
                        await supabase.from('invites').delete().eq('id', invite.id)
                        loadInvites()
                      }} />
                  )
                })}
              </div>
            )}

            {/* Accepted */}
            {invites.filter(i => i.accepted).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-cuesheet/30 mb-2">Team members</p>
                {invites.filter(i => i.accepted).map(invite => (
                  <div key={invite.id} className="flex items-center justify-between rounded-lg border border-graphite-line bg-riser px-4 py-3">
                    <div>
                      <p className="text-sm text-cuesheet">{invite.email}</p>
                      <p className="font-mono text-xs text-cuesheet/40">{invite.role}</p>
                    </div>
                    <span className="rounded-full border border-wash/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-wash">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showInvite && organization && (
        <InviteModal
          organizationId={organization.id}
          onClose={() => setShowInvite(false)}
          onCreated={() => { setShowInvite(false); loadInvites() }}
        />
      )}
    </div>
  )
}

function InviteRow({ invite, link, onRevoke }: { invite: Invite; link: string; onRevoke: () => void }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(link)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center justify-between rounded-lg border border-graphite-line bg-riser px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm text-cuesheet">{invite.email}</p>
        <p className="font-mono text-xs text-cuesheet/40">{invite.role} · pending</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={copy} className="text-xs text-wash hover:text-cuesheet flex items-center gap-1">
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy link</>}
        </button>
        <button onClick={onRevoke} className="text-xs text-standby hover:text-standby-dim">Revoke</button>
      </div>
    </div>
  )
}

function InviteModal({ organizationId, onClose, onCreated }:
  { organizationId: string; onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('')
  const [role,  setRole]  = useState<Role>('staff')
  const [error, setError] = useState<string | null>(null)
  const [busy,  setBusy]  = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    const { error } = await supabase.from('invites').insert({
      organization_id: organizationId,
      email: email.toLowerCase().trim(),
      role,
    })
    setBusy(false)
    if (error) { setError(error.message); return }
    onCreated()
  }

  return (
    <Modal title="Invite team member" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Email address">
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
            className={inputClass} placeholder="crew@example.com" />
        </Field>
        <Field label="Role">
          <select value={role} onChange={e => setRole(e.target.value as Role)} className={inputClass}>
            {ROLES.map(r => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
        </Field>
        <p className="mb-4 text-xs text-cuesheet/35">
          They'll receive a unique join link. Share it with them — link expires when accepted.
        </p>
        {error && <p className="mb-3 text-sm text-standby">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Sending…' : 'Generate invite link'}
        </Button>
      </form>
    </Modal>
  )
}
