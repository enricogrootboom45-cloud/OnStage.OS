import { Bell } from 'lucide-react'
import { NOTIFICATION_ICON, timeAgo } from './dashboardHelpers'
import type { AppNotification } from '../core/types'

export function ActivityInline({ activity }: { activity: AppNotification[] }) {
  if (activity.length === 0) return null
  return (
    <div className="space-y-2 rounded-lg border-l-2 border-amber bg-riser/60 px-4 py-3">
      {activity.slice(0, 3).map((n) => {
        const NIcon = NOTIFICATION_ICON[n.type] || Bell
        return (
          <div key={n.id} className="flex items-center gap-2.5 text-sm">
            <NIcon size={14} className="shrink-0 text-amber/80" />
            <span className="text-cuesheet/85">{n.title}</span>
            <span className="font-mono text-micro text-cuesheet/30">{timeAgo(n.created_at)}</span>
          </div>
        )
      })}
    </div>
  )
}

export function ActivityFeed({
  loading, activity,
}: {
  loading: boolean
  activity: AppNotification[]
}) {
  return (
    <div className="rounded-lg border border-graphite-line bg-riser p-5">
      <p className="font-display text-sm font-medium text-cuesheet">Workspace activity</p>
      <p className="mt-0.5 text-xs text-cuesheet/40">Operational signals</p>
      <div className="mt-4 space-y-3">
        {!loading && activity.length === 0 ? (
          <p className="py-4 text-center text-xs text-cuesheet/30">Nothing to report</p>
        ) : (
          activity.map((n) => {
            const NIcon = NOTIFICATION_ICON[n.type] || Bell
            return (
              <div key={n.id} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blackout text-amber/80">
                  <NIcon size={12} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-tight text-cuesheet/85">{n.title}</p>
                  <p className="mt-0.5 font-mono text-micro text-cuesheet/30">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}