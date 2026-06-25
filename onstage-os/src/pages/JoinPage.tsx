import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { Button } from '../core/components/Button'
import { inputClass } from '../core/components/Modal'
import type { Invite } from '../core/types'

export function JoinPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { session, refreshProfile } = useAuth()

  const inviteId = params.get('invite')

  const [invite,     setInvite]     = useState<Invite | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [mode,       setMode]       = useState<'sign-in' | 'sign-up'>('sign-up')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [done,       setDone]       = useState(false)

  // Load the invite
  useEffect(() => {
    if (!inviteId) { setLoading(false); return }
    async function load() {
      const { data } = await supabase
        .from('invites')
        .select('*')
        .eq('id', inviteId)
        .eq('accepted', false)
        .maybeSingle()
      setInvite(data as Invite | null)
      if (data?.email) setEmail(data.email)
      setLoading(false)
    }
    load()
  }, [inviteId])

  // If already logged in, just accept the invite
  useEffect(() => {
    if (!session || !invite || done) return
    async function accept() {
      await supabase.rpc('accept_invite', { p_email: invite!.email })
      await refreshProfile()
      setDone(true)
      setTimeout(() => navigate('/'), 1500)
    }
    accept()
  }, [session, invite]) // eslint-disable-line

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true); setError(null)
    try {
      if (mode === 'sign-up') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // accept_invite will be called via the useEffect above once session is set
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="font-mono text-xs uppercase tracking-widest text-cuesheet/30">Loading…</p>
    </div>
  )

  if (!inviteId || !invite) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-display text-base font-semibold text-cuesheet">Invalid invite</p>
      <p className="text-sm text-cuesheet/40">
        This invite link is invalid or has already been used.
      </p>
      <Button onClick={() => navigate('/')}>Go to dashboard</Button>
    </div>
  )

  if (done) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-display text-xl font-bold text-cuesheet">You're in.</p>
      <p className="text-sm text-cuesheet/50">Redirecting to your dashboard…</p>
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl font-semibold text-cuesheet">
            OnStage <span className="text-amber">OS</span>
          </p>
          <p className="mt-2 text-sm text-cuesheet/50">
            You've been invited to join a crew as{' '}
            <span className="font-medium text-cuesheet">{invite.role}</span>.
          </p>
        </div>

        <div className="rounded-lg border border-graphite-line bg-riser p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wide text-cuesheet/40">
                Email
              </span>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputClass} readOnly={!!invite.email}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wide text-cuesheet/40">
                Password
              </span>
              <input
                type="password" required minLength={6} value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
                placeholder={mode === 'sign-up' ? 'Choose a password' : 'Your password'}
              />
            </label>
            {error && <p className="text-sm text-standby">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Working…' : mode === 'sign-up' ? 'Create account & join' : 'Sign in & join'}
            </Button>
          </form>
          <button
            onClick={() => setMode(m => m === 'sign-in' ? 'sign-up' : 'sign-in')}
            className="mt-4 w-full text-center text-xs text-cuesheet/35 hover:text-cuesheet/60"
          >
            {mode === 'sign-up' ? 'Already have an account? Sign in' : 'New here? Create account'}
          </button>
        </div>
      </div>
    </div>
  )
}
