import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Ticket,
  UserCheck,
  Package,
  MapPin,
  Contact,
  Upload,
  X,
} from 'lucide-react'
import { clsx } from '../utils'
import { useLayout } from './LayoutContext'

const NAV = [
  { to: '/',              label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/events',        label: 'Events',       icon: Ticket },
  { to: '/staff',         label: 'Staff',        icon: UserCheck },
  { to: '/equipment',     label: 'Equipment',    icon: Package },
  { to: '/venues',        label: 'Venues',       icon: MapPin },
  { to: '/customers',     label: 'Customers',    icon: Contact },
  { to: '/import-leads',  label: 'Import leads', icon: Upload },
]

export function Sidebar({ orgName }: { orgName: string }) {
  const { closeSidebar } = useLayout()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-graphite-line bg-riser">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-graphite-line px-5 py-4">
        <div>
          <p className="font-display text-sm font-semibold tracking-tight text-cuesheet">
            OnStage <span className="text-amber">OS</span>
          </p>
          <p className="mt-0.5 truncate text-xs text-cuesheet/40">{orgName}</p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={closeSidebar}
          aria-label="Close menu"
          className="rounded-md p-1.5 text-cuesheet/40 hover:text-cuesheet lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-amber/10 text-amber-bright'
                  : 'text-cuesheet/55 hover:bg-blackout hover:text-cuesheet',
              )
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-graphite-line px-5 py-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-cuesheet/25">
          Cape Town · v0.1
        </p>
      </div>
    </aside>
  )
}
