import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-graphite-line px-6 py-16 text-center">
      {icon && <div className="text-graphite">{icon}</div>}
      <p className="font-display text-base text-cuesheet">{title}</p>
      <p className="max-w-sm text-sm text-cuesheet/50">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
