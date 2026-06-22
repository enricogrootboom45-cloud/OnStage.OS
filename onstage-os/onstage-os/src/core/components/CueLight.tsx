import { clsx } from '../utils'

export type CueTone = 'amber' | 'wash' | 'standby' | 'graphite' | 'cuesheet'

const DOT: Record<CueTone, string> = {
  amber: 'bg-amber shadow-[0_0_8px_2px_rgba(232,137,58,0.55)]',
  wash: 'bg-wash',
  standby: 'bg-standby shadow-[0_0_8px_2px_rgba(196,69,54,0.45)]',
  graphite: 'bg-graphite',
  cuesheet: 'bg-cuesheet/70',
}

const TEXT: Record<CueTone, string> = {
  amber: 'text-amber-bright',
  wash: 'text-wash',
  standby: 'text-standby',
  graphite: 'text-cuesheet/50',
  cuesheet: 'text-cuesheet/80',
}

export function CueLight({
  tone,
  label,
  pulse = false,
}: {
  tone: CueTone
  label: string
  pulse?: boolean
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border border-graphite-line/80 bg-riser px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider',
        TEXT[tone],
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', DOT[tone], pulse && 'cue-pulse')} />
      {label}
    </span>
  )
}
