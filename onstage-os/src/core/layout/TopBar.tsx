import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { useLayout } from './LayoutContext'

export function TopBar({ title }: { title: string }) {
  const { profile, signOut } = useAuth()
  const { toggleSidebar } = useLayout()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-graphite-line bg-blackout px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — visible only on mobile */}
        <button
          onClick={toggleSidebar}
          aria-label="Open menu"
          className="rounded-md p-1.5 text-cuesheet/50 hover:text-cuesheet lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-base font-semibold text-cuesheet lg:text-lg">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-sm text-cuesheet">{profile?.full_name || 'Crew member'}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-cuesheet/40">
            {profile?.role}
          </p>
        </div>
        <button
          onClick={signOut}
          aria-label="Sign out"
          className="rounded-md border border-graphite-line p-2 text-cuesheet/50 hover:text-cuesheet"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
