import type { EventRecord } from '../core/types'
import { formatCountdown } from './dashboardHelpers'

export function Hero({
  loading, liveEvent, nextEvent, now,
}: {
  loading: boolean
  liveEvent: EventRecord | null
  nextEvent: EventRecord | null
  now: Date
}) {
  return (
    <div className={`light-sweep rounded-xl border p-8 ${
      liveEvent ? 'border-amber/25 bg-riser shadow-glow' : 'border-graphite-line bg-riser'
    }`}>
      {loading ? (
        <div className="h-16 animate-pulse rounded bg-blackout/40" />
      ) : liveEvent ? (
        <>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-standby px-2.5 py-1 font-mono text-micro uppercase tracking-wider text-cuesheet cue-pulse">
            Live now
          </span>
          <h1 className="mt-3 font-display text-display-hero text-cuesheet">{liveEvent.name}</h1>
          {liveEvent.end_time && (
            <p className="mt-2 text-cuesheet/50">Wraps in {formatCountdown(new Date(liveEvent.end_time), now)}</p>
          )}
        </>
      ) : nextEvent ? (
        <>
          <span className="font-mono text-label uppercase tracking-wider text-cuesheet/35">Next up</span>
          <h1 className="mt-2 font-display text-display-hero text-cuesheet">{nextEvent.name}</h1>
          <p className="mt-2 text-cuesheet/50">Doors in {formatCountdown(new Date(nextEvent.start_time), now)}</p>
        </>
      ) : (
        <>
          <h1 className="font-display text-display-1 text-cuesheet/50">Nothing on the books</h1>
          <p className="mt-1 text-sm text-cuesheet/35">Publish a production to see it here.</p>
        </>
      )}
    </div>
  )
}