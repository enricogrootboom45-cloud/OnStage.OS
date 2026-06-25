import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import type { Organization, Profile } from '../types'

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  organization: Organization | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    const p = data as Profile | null
    setProfile(p)
    // Auto-accept a pending invite for this email
    if (!p?.organization_id && userId) {
      const { data: userRes } = await supabase.auth.getUser()
      const email = userRes?.user?.email
      if (email) {
        const { data: inv } = await supabase
          .from('invites')
          .select('id')
          .eq('email', email.toLowerCase().trim())
          .eq('accepted', false)
          .maybeSingle()
        if (inv) {
          await supabase.rpc('accept_invite', { p_email: email })
          // Re-fetch profile after accepting
          const { data: updated } = await supabase
            .from('profiles').select('*').eq('id', userId).maybeSingle()
          const updatedProfile = updated as Profile | null
          setProfile(updatedProfile)
          if (updatedProfile?.organization_id) {
            const { data: org } = await supabase
              .from('organizations').select('*')
              .eq('id', updatedProfile.organization_id).maybeSingle()
            setOrganization(org as Organization | null)
          }
          return
        }
      }
    }
    if (p?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', p.organization_id)
        .maybeSingle()
      setOrganization(org as Organization | null)
    } else {
      setOrganization(null)
    }
  }

  async function refreshProfile() {
    if (session?.user) await loadProfile(session.user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session?.user) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        await loadProfile(newSession.user.id)
      } else {
        setProfile(null)
        setOrganization(null)
      }
    })

    return () => listener.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ session, profile, organization, loading, refreshProfile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
