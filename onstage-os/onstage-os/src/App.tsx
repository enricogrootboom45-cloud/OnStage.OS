import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './core/auth/AuthProvider'
import { AppShell } from './core/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { OnboardingOrg } from './pages/OnboardingOrg'
import { ReportsHome } from './reports/ReportsHome'
import { EventsList } from './ticketing/EventsList'
import { EventDetail } from './ticketing/EventDetail'
import { StaffRoster } from './staff-ops/StaffRoster'
import { EquipmentTracker } from './staff-ops/EquipmentTracker'
import { VenuesList } from './venues/VenuesList'
import { CustomersList } from './crm/CustomersList'
import { ImportLeads } from './crm/ImportLeads'

function Gate() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-cuesheet/30">
          Raising house lights…
        </p>
      </div>
    )
  }

  if (!session) return <LoginPage />
  if (!profile?.organization_id) return <OnboardingOrg />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/"              element={<ReportsHome />} />
        <Route path="/events"        element={<EventsList />} />
        <Route path="/events/:id"    element={<EventDetail />} />
        <Route path="/staff"         element={<StaffRoster />} />
        <Route path="/equipment"     element={<EquipmentTracker />} />
        <Route path="/venues"        element={<VenuesList />} />
        <Route path="/customers"     element={<CustomersList />} />
        <Route path="/import-leads"  element={<ImportLeads />} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
