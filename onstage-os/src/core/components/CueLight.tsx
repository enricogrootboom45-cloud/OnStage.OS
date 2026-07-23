import { clsx } from '../utils'

export type CueStatus = 'live' | 'standby' | 'offline' | 'done'

interface CueLightProps {
  status: CueStatus
  pulse?: boolean
  className?: string
}

export function CueLight({ status, pulse = false, className }: CueLightProps) {
  const colors: Record<CueStatus, string> = {
    live: 'bg-amber shadow-glow shadow-amber/40',
    standby: 'bg-sky-400',
    offline: 'bg-graphite-line',
    done: 'bg-emerald-500'
  }

  const isPulsing = pulse && (status === 'live' || status === 'standby')

  return (
    <div className={clsx("relative flex h-2.5 w-2.5 items-center justify-center", className)}>
      {isPulsing && (
        <span className={clsx(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
          status === 'live' ? 'bg-amber' : 'bg-sky-400'
        )} />
      )}
      <span className={clsx('relative inline-flex h-2.5 w-2.5 rounded-full', colors[status])} />
    </div>
  )
}