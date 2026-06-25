import { useAuth } from '../auth/AuthProvider'
import type { Role } from '../types'

// Hierarchy: owner > admin > manager > staff
const ROLE_LEVEL: Record<Role, number> = {
  owner:   4,
  admin:   3,
  manager: 2,
  staff:   1,
}

export function useRole() {
  const { profile } = useAuth()
  const role: Role = profile?.role ?? 'staff'
  const level = ROLE_LEVEL[role]

  return {
    role,
    isOwner:   role === 'owner',
    isAdmin:   level >= ROLE_LEVEL.admin,
    isManager: level >= ROLE_LEVEL.manager,
    isStaff:   level >= ROLE_LEVEL.staff,
    // Specific permission checks
    can: {
      viewReports:    level >= ROLE_LEVEL.manager,
      manageEvents:   level >= ROLE_LEVEL.manager,
      manageStaff:    level >= ROLE_LEVEL.manager,
      manageEquipment:level >= ROLE_LEVEL.manager,
      manageVenues:   level >= ROLE_LEVEL.manager,
      viewCustomers:  level >= ROLE_LEVEL.manager,
      importLeads:    level >= ROLE_LEVEL.admin,
      scanDoor:       level >= ROLE_LEVEL.staff,
      selfClockIn:    level >= ROLE_LEVEL.staff,
      orgSettings:    role === 'owner',
    },
  }
}
