import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './core/auth/AuthProvider'
import { AppShell } from './core/layout/AppShell'
import { RoleGate } from './core/components/RoleGate'
import { LoginPage } from './pages/LoginPage'
import { OnboardingOrg } from './pages/OnboardingOrg'

// ── Lazy-loaded route chunks ──────────────────────────────────
// Each import() becomes a separate JS chunk — only loaded when
// the user actually navigates to that route.
function lz<M, K extends keyof M>(fn: () => Promise<M>, key: K) {
  return lazy(() => fn().then(m => ({ default: m[key] as React.ComponentType })))
}

const ReportsHome     = lz(() => import('./reports/ReportsHome'),          'ReportsHome')
const EventsList      = lz(() => import('./ticketing/EventsList'),         'EventsList')
const EventDetail     = lz(() => import('./ticketing/EventDetail'),        'EventDetail')
const StaffRoster     = lz(() => import('./staff-ops/StaffRoster'),        'StaffRoster')
const EquipmentTracker= lz(() => import('./staff-ops/EquipmentTracker'),   'EquipmentTracker')
const VenuesList      = lz(() => import('./venues/VenuesList'),            'VenuesList')
const CustomersList   = lz(() => import('./crm/CustomersList'),            'CustomersList')
const CustomerProfile = lz(() => import('./crm/CustomerProfile'),          'CustomerProfile')
const ImportLeads     = lz(() => import('./crm/ImportLeads'),              'ImportLeads')
const DoorScanner     = lz(() => import('./staff-ops/DoorScanner'),        'DoorScanner')
const SelfClockIn     = lz(() => import('./staff-ops/SelfClockIn'),        'SelfClockIn')
const SettingsPage    = lz(() => import('./settings/SettingsPage'),        'SettingsPage')
const CreatePost      = lz(() => import('./social/CreatePost'),            'CreatePost')

// Public (unauthenticated) — still lazy so they don't inflate the shell
const PublicEventPage = lz(() => import('./public/PublicEventPage'),       'PublicEventPage')
const TicketSuccess   = lz(() => import('./public/TicketSuccess'),         'TicketSuccess')
const TicketView      = lz(() => import('./public/TicketView'),            'TicketView')
const JoinPage        = lz(() => import('./pages/JoinPage'),               'JoinPage')

// ── Shared loading fallback ───────────────────────────────────
function PageLoader() {
  return (
    <div className="flex h-full min-h-screen items-center justify-center">
      <Loader2 size={22} className="animate-spin text-amber/60" />
    </div>
  )
}

// ── Protected shell ───────────────────────────────────────────
function ProtectedApp() {
  const { session, profile, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!session)                return <LoginPage />
  if (!profile?.organization_id) return <OnboardingOrg />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/"                element={<RoleGate require="manager"><ReportsHome /></RoleGate>} />
        <Route path="/events"          element={<RoleGate require="manager"><EventsList /></RoleGate>} />
        <Route path="/events/:id"      element={<RoleGate require="manager"><EventDetail /></RoleGate>} />
        <Route path="/staff"           element={<RoleGate require="manager"><StaffRoster /></RoleGate>} />
        <Route path="/equipment"       element={<RoleGate require="manager"><EquipmentTracker /></RoleGate>} />
        <Route path="/venues"          element={<RoleGate require="manager"><VenuesList /></RoleGate>} />
        <Route path="/customers"       element={<RoleGate require="manager"><CustomersList /></RoleGate>} />
        <Route path="/customers/:id"   element={<RoleGate require="manager"><CustomerProfile /></RoleGate>} />
        <Route path="/post"            element={<RoleGate require="manager"><CreatePost /></RoleGate>} />
        <Route path="/import-leads"    element={<RoleGate require="admin"><ImportLeads /></RoleGate>} />
        <Route path="/scan"            element={<RoleGate require="staff"><DoorScanner /></RoleGate>} />
        <Route path="/my-shifts"       element={<RoleGate require="staff"><SelfClockIn /></RoleGate>} />
        <Route path="/settings"        element={<RoleGate require="owner"><SettingsPage /></RoleGate>} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

// ── Root ──────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public — no auth */}
          <Route path="/e/:slug"         element={<PublicEventPage />} />
          <Route path="/t/:id"           element={<TicketView />} />
          <Route path="/tickets/success" element={<TicketSuccess />} />
          <Route path="/join"            element={<JoinPage />} />

          {/* Everything else is protected */}
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}