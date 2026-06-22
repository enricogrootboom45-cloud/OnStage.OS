import { useState, type FormEvent } from 'react'
import { supabase } from '../core/supabaseClient'
import { Button } from '../core/components/Button'
import { inputClass } from '../core/components/Modal'

export function LoginPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setConfirmSent(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl font-semibold text-cuesheet">
            OnStage <span className="text-amber">OS</span>
          </p>
          <p className="mt-1 text-sm text-cuesheet/45">
            Crew, venues, tickets, and customers — one console.
          </p>
        </div>

        <div className="rounded-lg border border-graphite-line bg-riser p-6 shadow-desk">
          {confirmSent ? (
            <p className="text-sm text-cuesheet/70">
              Check <span className="text-cuesheet">{email}</span> to confirm your account, then
              sign in.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="mb-3 block">
                <span className="mb-1 block text-xs uppercase tracking-wide text-cuesheet/40">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@yourcompany.com"
                />
              </label>
              <label className="mb-4 block">
                <span className="mb-1 block text-xs uppercase tracking-wide text-cuesheet/40">
                  Password
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </label>

              {error && <p className="mb-4 text-sm text-standby">{error}</p>}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Working…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
              </Button>
            </form>
          )}

          {!confirmSent && (
            <button
              onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
              className="mt-4 w-full text-center text-xs text-cuesheet/40 hover:text-cuesheet/70"
            >
              {mode === 'sign-in'
                ? "New here? Create an account"
                : 'Already have an account? Sign in'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
