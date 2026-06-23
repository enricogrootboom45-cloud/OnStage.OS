import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Ticket,
  UserCheck,
  Package,
  MapPin,
  Contact,
  Upload,
  Camera,
  Clock,
  X,
} from 'lucide-react'
import { clsx } from '../utils'
import { useLayout } from './LayoutContext'
import { useRole } from '../hooks/useRole'

const MGMT_NAV = [
  { to: '/',          label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/events',    label: 'Events',    icon: Ticket },
  { to: '/staff',     label: 'Staff',     icon: UserCheck },
  { to: '/equipment', label: 'Equipment', icon: Package },
  { to: '/venues',    label: 'Venues',    icon: MapPin },
  { to: '/customers', label: 'Customers', icon: Contact },
]

const STAFF_NAV = [
  { to: '/my-shifts', label: 'My shifts',     icon: Clock },
  { to: '/scan',      label: 'Door scanner',  icon: Camera },
]

export function Sidebar({ orgName }: { orgName: string }) {
  const { closeSidebar } = useLayout()
  const { isManager, isAdmin } = useRole()

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
        <button
          onClick={closeSidebar}
          aria-label="Close menu"
          className="rounded-md p-1.5 text-cuesheet/40 hover:text-cuesheet lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Management section — manager and above */}
        {isManager && (
          <>
            <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-widest text-cuesheet/25">
              Manage
            </p>
            <div className="mb-4 space-y-0.5">
              {MGMT_NAV.map(({ to, label, icon: Icon, end }) => (
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
            </div>
          </>
        )}

        {/* Staff tools — all roles */}
        <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-widest text-cuesheet/25">
          Crew tools
        </p>
        <div className="mb-4 space-y-0.5">
          {STAFF_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
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
        </div>

        {/* Admin-only tools */}
        {isAdmin && (
          <>
            <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-widest text-cuesheet/25">
              Data
            </p>
            <div className="space-y-0.5">
              <NavLink
                to="/import-leads"
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-amber/10 text-amber-bright'
                      : 'text-cuesheet/55 hover:bg-blackout hover:text-cuesheet',
                  )
                }
              >
                <Upload size={17} strokeWidth={2} />
                Import leads
              </NavLink>
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-graphite-line px-5 py-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-cuesheet/25">
          Cape Town · v0.2
        </p>
      </div>
    </aside>
  )
}
