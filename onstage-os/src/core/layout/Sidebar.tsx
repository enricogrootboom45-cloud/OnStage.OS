import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Ticket, UserCheck, Package,
  MapPin, Contact, Upload, Camera, Clock, Settings, Send, X,
} from 'lucide-react'
import { clsx } from '../utils'
import { useLayout } from './LayoutContext'
import { useRole } from '../hooks/useRole'

const MGMT_NAV = [
  { to: '/',          label: 'Mission Control',    icon: LayoutDashboard, end: true },
  { to: '/events',    label: 'Productions',        icon: Ticket },
  { to: '/staff',     label: 'Crew',                icon: UserCheck },
  { to: '/equipment', label: 'Production Assets',  icon: Package },
  { to: '/venues',    label: 'Venues',              icon: MapPin },
  { to: '/customers', label: 'Audience',            icon: Contact },
  { to: '/post',      label: 'Community',           icon: Send },
]

const CREW_NAV = [
  { to: '/my-shifts', label: 'My shifts',    icon: Clock   },
  { to: '/scan',      label: 'Door scanner', icon: Camera  },
]

function NavItem({ to, label, icon: Icon, end }: {
  to: string; label: string; icon: React.ElementType; end?: boolean
}) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) => clsx(
        'relative flex items-center gap-2.5 rounded-md py-2.5 pl-3 pr-3 text-sm transition-colors',
        isActive
          ? 'bg-amber/10 text-amber-bright before:absolute before:-left-3 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-amber before:content-[""]'
          : 'text-cuesheet/55 hover:bg-blackout hover:text-cuesheet',
      )}
    >
      <Icon size={17} strokeWidth={2} />
      {label}
    </NavLink>
  )
}

export function Sidebar({ orgName }: { orgName: string }) {
  const { closeSidebar } = useLayout()
  const { isManager, isAdmin, isOwner } = useRole()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-graphite-line bg-riser">
      <div className="flex items-center justify-between border-b border-graphite-line px-5 py-4">
        <div>
          <p className="font-display text-sm font-semibold tracking-tight text-cuesheet">
            OnStage <span className="text-amber">OS</span>
          </p>
          <p className="mt-0.5 truncate text-xs text-cuesheet/40">{orgName}</p>
        </div>
        <button onClick={closeSidebar} aria-label="Close menu"
          className="rounded-md p-1.5 text-cuesheet/40 hover:text-cuesheet lg:hidden">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {isManager && (
          <section>
            <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-widest text-cuesheet/25">
              Manage
            </p>
            <div className="space-y-0.5">
              {MGMT_NAV.map(n => <NavItem key={n.to} {...n} />)}
            </div>
          </section>
        )}

        <section>
          <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-widest text-cuesheet/25">
            Crew tools
          </p>
          <div className="space-y-0.5">
            {CREW_NAV.map(n => <NavItem key={n.to} {...n} />)}
          </div>
        </section>

        {isAdmin && (
          <section>
            <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-widest text-cuesheet/25">
              Data
            </p>
            <div className="space-y-0.5">
              <NavItem to="/import-leads" label="Import leads" icon={Upload} />
            </div>
          </section>
        )}

        {isOwner && (
          <section>
            <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-widest text-cuesheet/25">
              Org
            </p>
            <div className="space-y-0.5">
              <NavItem to="/settings" label="Settings" icon={Settings} />
            </div>
          </section>
        )}
      </nav>

      <div className="border-t border-graphite-line px-5 py-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-cuesheet/25">
          Cape Town · v0.5 · Beta 
        </p>
      </div>
    </aside>
  )
}