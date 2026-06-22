import type { ReactNode } from 'react'
import { clsx } from '../utils'

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
  tone?: 'default' | 'warning'
}) {
  return (
    <div className="rounded-lg border border-graphite-line bg-riser p-4 shadow-desk">
      <div className="flex items-start justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-cuesheet/40">
          {label}
        </span>
        {icon && <span className="text-cuesheet/30">{icon}</span>}
      </div>
      <p
        className={clsx(
          'mt-2 font-display text-2xl font-semibold',
          tone === 'warning' ? 'text-standby' : 'text-cuesheet',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-cuesheet/40">{hint}</p>}
    </div>
  )
}
