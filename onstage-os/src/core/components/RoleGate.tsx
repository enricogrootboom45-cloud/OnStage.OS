import type { ReactNode } from 'react'
import { ShieldOff } from 'lucide-react'
import { useRole } from '../hooks/useRole'
import type { Role } from '../types'

interface RoleGateProps {
  require: Role
  children: ReactNode
  fallback?: ReactNode
}

const ROLE_LEVEL: Record<Role, number> = {
  owner: 4, admin: 3, manager: 2, staff: 1,
}

export function RoleGate({ require: required, children, fallback }: RoleGateProps) {
  const { role } = useRole()

  if (ROLE_LEVEL[role] >= ROLE_LEVEL[required]) {
    return <>{children}</>
  }

  if (fallback) return <>{fallback}</>

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <ShieldOff size={28} className="text-graphite" />
      <p className="font-display text-sm text-cuesheet">Access restricted</p>
      <p className="max-w-xs text-xs text-cuesheet/40">
        You need {required} access or above to view this section. Ask your organization owner to update your role.
      </p>
    </div>
  )
}
