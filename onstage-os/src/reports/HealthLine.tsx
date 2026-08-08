import { ChevronRight } from 'lucide-react'

export function HealthLine({
  icon: Icon, tone, headline, sub, href,
}: {
  icon: React.ElementType
  tone: 'amber' | 'wash' | 'standby' | 'graphite'
  headline: string
  sub?: string
  href: string
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg border border-graphite-line bg-riser px-4 py-3.5 transition-colors hover:border-cuesheet/20"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blackout ${
        tone === 'standby' ? 'text-standby' : tone === 'amber' ? 'text-amber-bright' : 'text-cuesheet/40'
      }`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-cuesheet">{headline}</p>
        {sub && <p className={`mt-0.5 text-xs ${tone === 'standby' ? 'text-standby/80' : 'text-cuesheet/40'}`}>{sub}</p>}
      </div>
      <ChevronRight size={15} className="shrink-0 text-cuesheet/20" />
    </a>
  )
}