import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { clsx } from '../utils'

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  trend,
}: {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
  tone?: 'default' | 'warning' | 'live'
  trend?: { direction: 'up' | 'down'; label: string; good?: boolean }
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
      {trend ? (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className={clsx(
              'inline-flex items-center gap-0.5 font-mono text-[11px]',
              (trend.good ?? trend.direction === 'up') ? 'text-wash' : 'text-standby',
            )}
          >
            {trend.direction === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.label}
          </span>
          {hint && <span className="text-xs text-cuesheet/30">{hint}</span>}
        </div>
      ) : (
        hint && <p className="mt-1 text-xs text-cuesheet/40">{hint}</p>
      )}
    </div>
  )
}