import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { LayoutProvider, useLayout } from './LayoutContext'
import { useAuth } from '../auth/AuthProvider'

function Shell() {
  const { profile, organization } = useAuth()
  const { sidebarOpen, closeSidebar } = useLayout()
  const location = useLocation()

  // Close sidebar on route change (mobile)
  useEffect(() => {
    closeSidebar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const orgName = organization?.name || (profile ? 'Setting up…' : 'Loading…')

  return (
    <div className="relative flex h-screen overflow-hidden">
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-blackout/70 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — fixed on desktop, drawer on mobile */}
      <div
        className={[
          'fixed inset-y-0 left-0 z-40 flex-shrink-0 transition-transform duration-200',
          'lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <Sidebar orgName={orgName} />
      </div>

      {/* Main content */}
      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

export function AppShell() {
  return (
    <LayoutProvider>
      <Shell />
    </LayoutProvider>
  )
}
