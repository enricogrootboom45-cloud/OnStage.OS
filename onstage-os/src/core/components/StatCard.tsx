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
  tone?: 'default' | 'warning' | 'live'
}) {
  return (
    <div
      className={clsx(
        'rounded-lg border p-4',
        tone === 'warning'
          ? 'border-standby/30 bg-riser shadow-alert'
          : tone === 'live'
            ? 'border-amber/25 bg-riser shadow-glow'
            : 'border-graphite-line bg-riser shadow-desk',
      )}
    >
      <div className="flex items-start justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-cuesheet/40">
          {label}
        </span>
        {icon && (
          <span
            className={clsx(
              tone === 'warning' ? 'text-standby' : tone === 'live' ? 'text-amber-bright' : 'text-cuesheet/30',
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p
        className={clsx(
          'mt-2 font-display text-2xl font-semibold',
          tone === 'warning' ? 'text-standby' : tone === 'live' ? 'text-amber-bright' : 'text-cuesheet',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-cuesheet/40">{hint}</p>}
    </div>
  )
}