import { clsx } from '../utils'

export type CueTone = 'amber' | 'wash' | 'standby' | 'graphite' | 'cuesheet'

export interface CueLightProps {
  tone: CueTone
  label: string
  pulse?: boolean
  className?: string
}

const DOT: Record<CueTone, string> = {
  amber: 'bg-amber',
  wash: 'bg-wash',
  standby: 'bg-standby',
  graphite: 'bg-graphite',
  cuesheet: 'bg-cuesheet/60',
}

const TEXT: Record<CueTone, string> = {
  amber: 'text-amber-bright',
  wash: 'text-wash',
  standby: 'text-standby',
  graphite: 'text-cuesheet/40',
  cuesheet: 'text-cuesheet/60',
}

export function CueLight({ tone, label, pulse = false, className }: CueLightProps) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs', TEXT[tone], className)}>
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        {pulse && (
          <span className={clsx('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', DOT[tone])} />
        )}
        <span className={clsx('relative inline-flex h-2 w-2 rounded-full', DOT[tone])} />
      </span>
      {label}
    </span>
  )
}